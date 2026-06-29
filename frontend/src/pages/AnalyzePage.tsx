import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@/lib/router-compat'
import NavBar from '../components/layout/NavBar'
import SpecBox from '../components/ui/SpecBox'
import { api } from '../api/client'
import type { IngestStatus } from '../types'
import styles from './AnalyzePage.module.css'

const STEPS = [
  { label: 'Fetching repository metadata',      code: 'github.fetch_meta()' },
  { label: 'Pulling commit history',            code: 'github.fetch_commits()' },
  { label: 'Ingesting pull requests & issues',  code: 'github.fetch_prs() + issues()' },
  { label: 'Building Cognee knowledge graph',   code: 'cognee.remember(data)' },
  { label: 'Running improve() enrichment',      code: 'cognee.improve()' },
]

type StepState = 'idle' | 'active' | 'done'
type Phase     = 'input' | 'ingesting' | 'done' | 'error'

export default function AnalyzePage() {
  const navigate = useNavigate()
  const [url, setUrl]                     = useState('')
  const [includeCommits, setCommits]      = useState(true)
  const [includePrs, setPrs]              = useState(true)
  const [includeIssues, setIssues]        = useState(true)
  const [phase, setPhase]                 = useState<Phase>('input')
  const [status, setStatus]               = useState<IngestStatus | null>(null)
  const [stepStates, setStepStates]       = useState<StepState[]>(Array(5).fill('idle'))
  const [logs, setLogs]                   = useState<string[]>([])
  const [errorMsg, setErrorMsg]           = useState('')
  const logRef   = useRef<HTMLDivElement>(null)
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const addLog = (msg: string) => setLogs(p => [...p, msg])

  const setStep = (i: number, s: StepState) =>
    setStepStates(p => { const n = [...p]; n[i] = s; return n })

  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight) }, [logs])
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const simulateProgress = () => {
    let step = 0
    addLog('> Initializing Cognee memory layer...')
    addLog('> Connecting to GitHub API...')
    const advance = () => {
      if (step >= STEPS.length) return
      setStep(step, 'active')
      addLog(`> ${STEPS[step].label}...`)
      setTimeout(() => {
        setStep(step, 'done')
        addLog(`> ✓ ${STEPS[step].code}`)
        step++
        if (step < STEPS.length) setTimeout(advance, 1400)
      }, 1600)
    }
    advance()
  }

  const handleSubmit = async () => {
    if (!url.trim()) return
    setErrorMsg('')
    setPhase('ingesting')
    setStepStates(Array(5).fill('idle'))
    setLogs([])

    try {
      const res = await api.ingest.start({ repo_url: url.trim(), include_commits: includeCommits, include_prs: includePrs, include_issues: includeIssues })
      setStatus(res)
      simulateProgress()

      pollRef.current = setInterval(async () => {
        try {
          const s = await api.ingest.getStatus(res.repo_id)
          setStatus(s)
          if (s.status === 'complete') {
            clearInterval(pollRef.current!)
            setTimeout(() => setPhase('done'), 800)
          } else if (s.status === 'error') {
            clearInterval(pollRef.current!)
            setErrorMsg(s.message)
            setPhase('error')
          }
        } catch {}
      }, 2000)
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail || 'Failed to connect to backend.')
      setPhase('error')
    }
  }

  const pct = (stepStates.filter(s => s === 'done').length / STEPS.length) * 100

  return (
    <div className={styles.page}>
      <NavBar />
      <div className={styles.content}>

        <div className={styles.header}>
          <div className={styles.badge}>
            <div className="status-dot active" />
            <span className="t-mono-xs">CASE INTAKE · STEP 1 OF 3</span>
          </div>
          <h1 className={`t-display-lg ${styles.title}`}>Open a Case</h1>
          <p className="t-body" style={{ color: 'var(--ink-dim)', maxWidth: 520 }}>
            Point Lore at any public GitHub repository. It will ingest your full commit history,
            pull requests, and issues into a persistent Cognee knowledge graph.
          </p>
        </div>

        {/* INPUT */}
        {phase === 'input' && (
          <SpecBox label="Repository URL" meta="Public repos only">
            <div className={styles.inputRow}>
              <input
                className={styles.urlInput}
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="https://github.com/owner/repository"
              />
              <button className="btn-primary" onClick={handleSubmit}>Ingest →</button>
            </div>
            <div className={styles.checkboxRow}>
              {[
                { label: 'Commits',       val: includeCommits, set: setCommits },
                { label: 'Pull Requests', val: includePrs,     set: setPrs },
                { label: 'Issues',        val: includeIssues,  set: setIssues },
              ].map(o => (
                <label key={o.label} className={styles.checkChip}>
                  <input type="checkbox" checked={o.val} onChange={e => o.set(e.target.checked)} />
                  <span className="t-mono-xs">{o.label}</span>
                </label>
              ))}
            </div>
          </SpecBox>
        )}

        {/* INGESTING */}
        {(phase === 'ingesting' || phase === 'done') && (
          <SpecBox
            label="Ingestion Progress"
            meta={phase === 'done' ? '✓ COMPLETE' : 'RUNNING...'}
            accent={phase === 'done'}
          >
            {/* Progress bar */}
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: phase === 'done' ? '100%' : `${pct}%` }} />
            </div>

            {/* Steps */}
            <div className={styles.stepsList}>
              {STEPS.map((s, i) => (
                <div key={i} className={styles.stepRow}>
                  <div className={`${styles.stepIcon} ${styles[stepStates[i]]}`}>
                    {stepStates[i] === 'done' ? '✓' : String(i+1).padStart(2,'0')}
                  </div>
                  <div>
                    <div className={`t-body-sm ${stepStates[i] === 'idle' ? styles.mutedLabel : ''}`}>
                      {s.label}
                    </div>
                    {stepStates[i] !== 'idle' && (
                      <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>{s.code}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            {status && (
              <div className={styles.statsGrid}>
                {[
                  ['Commits', status.commits],
                  ['Pull Requests', status.prs],
                  ['Issues', status.issues],
                  ['Nodes', status.nodes || status.commits + status.prs + status.issues],
                ].map(([k,v]) => (
                  <div key={k as string} className={styles.statCell}>
                    <span className={styles.statVal}>{(v as number).toLocaleString()}</span>
                    <span className="t-label">{k}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Log */}
            <div className={styles.logStream} ref={logRef}>
              {logs.map((l,i) => (
                <div key={i} className={`${styles.logLine} ${l.startsWith('> ✓') ? styles.logSuccess : ''}`}>{l}</div>
              ))}
            </div>
          </SpecBox>
        )}

        {/* SUCCESS */}
        {phase === 'done' && status && (
          <div className={`bp-card ${styles.successCard}`}>
            <div className={styles.successHeader}>
              <div className="status-dot active" />
              <span className="t-mono-xs" style={{ color: 'var(--success)' }}>CASE OPENED · MEMORY ACTIVE</span>
            </div>
            <div style={{ padding: 24 }}>
              <h2 className="t-heading" style={{ color: 'var(--ink)', marginBottom: 8 }}>Codebase ingested.</h2>
              <p className="t-body-sm" style={{ color: 'var(--ink-dim)', marginBottom: 24, maxWidth: 480 }}>
                Lore has built a persistent knowledge graph. You can now interrogate its entire history across infinite sessions.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-primary" onClick={() => navigate(`/chat/${status.repo_id}`)}>
                  Open Chat →
                </button>
                <button className="btn-secondary" onClick={() => navigate(`/memory/${status.repo_id}`)}>
                  View Graph
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <SpecBox label="Error">
            <p className="t-body-sm" style={{ color: 'var(--error)', marginBottom: 16 }}>{errorMsg}</p>
            <button className="btn-ghost" onClick={() => { setPhase('input'); setLogs([]) }}>
              Try Again
            </button>
          </SpecBox>
        )}

        {/* INFO */}
        <div className={styles.infoGrid}>
          <SpecBox label="What gets ingested">
            <p className="t-body-sm" style={{ color: 'var(--ink-dim)', lineHeight: 1.65 }}>
              All commit messages, pull request titles and bodies, issue descriptions and comment threads, and repository README.
            </p>
          </SpecBox>
          <SpecBox label="How memory works">
            <p className="t-body-sm" style={{ color: 'var(--ink-dim)', lineHeight: 1.65 }}>
              Cognee structures everything into a hybrid graph-vector store. Relationships between contributors, decisions, and code are permanently mapped.
            </p>
          </SpecBox>
        </div>

      </div>
    </div>
  )
}
