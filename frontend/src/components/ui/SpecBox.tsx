import styles from './SpecBox.module.css'
import type { ReactNode } from 'react'

interface SpecBoxProps {
  label: string
  meta?: string
  children: ReactNode
  className?: string
  accent?: boolean
}

export default function SpecBox({ label, meta, children, className = '', accent }: SpecBoxProps) {
  return (
    <div className={`bp-card ${styles.box} ${accent ? styles.accent : ''} ${className}`}>
      <div className="spec-header">
        <span className="t-label">{label}</span>
        {meta && <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>{meta}</span>}
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
