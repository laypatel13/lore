import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './ProviderSelect.module.css'

export interface ProviderOption {
  value: string
  label: string
  description: string
}

interface ProviderSelectProps {
  value: string
  onChange: (value: string) => void
  options: ProviderOption[]
  label?: string
}

export default function ProviderSelect({ value, onChange, options, label = 'LLM Provider' }: ProviderSelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex(o => o.value === value)))
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxId = 'provider-select-listbox'

  const selected = options.find(o => o.value === value) ?? options[0]
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null)

  // Close on outside click (checks both the trigger root AND the portaled panel)
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      const insideTrigger = rootRef.current?.contains(target)
      const insidePanel = listRef.current?.contains(target)
      if (!insideTrigger && !insidePanel) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Position the portaled panel against the trigger, and keep it glued on
  // scroll/resize (the panel lives at document.body, escaping any
  // ancestor's `overflow: hidden`, e.g. the SpecBox card).
  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const el = triggerRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.bottom + 8, left: r.left, width: r.width })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  // Keep active option scrolled into view + synced when opening
  useEffect(() => {
    if (open) {
      const idx = Math.max(0, options.findIndex(o => o.value === value))
      setActiveIndex(idx)
      requestAnimationFrame(() => {
        const el = listRef.current?.children[idx] as HTMLElement | undefined
        el?.scrollIntoView({ block: 'nearest' })
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (idx: number) => {
    const opt = options[idx]
    if (!opt) return
    onChange(opt.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(i => Math.min(options.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(i => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(activeIndex)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <span className="t-mono-xs" style={{ color: 'var(--ink-dim)', display: 'block', marginBottom: 8 }}>{label}</span>

      <button
        type="button"
        ref={triggerRef}
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={styles.triggerText}>
          <span className={styles.triggerLabel}>{selected.label}</span>
          <span className={styles.triggerDesc}>{selected.description}</span>
        </span>
        <svg className={styles.chevron} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 5.5L7 9.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && rect && createPortal(
        <div
          className={styles.panelWrap}
          style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width }}
        >
          <ul
            id={listboxId}
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={`provider-opt-${activeIndex}`}
            className={styles.panel}
            onKeyDown={onListKeyDown}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value
              const isActive = i === activeIndex
              return (
                <li
                  key={opt.value}
                  id={`provider-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.option} ${isActive ? styles.optionActive : ''} ${isSelected ? styles.optionSelected : ''}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => commit(i)}
                >
                  <span className={styles.optionText}>
                    <span className={styles.optionLabel}>{opt.label}</span>
                    <span className={styles.optionDesc}>{opt.description}</span>
                  </span>
                  <span className={styles.check} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>,
        document.body
      )}
    </div>
  )
}
