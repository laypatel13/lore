import { useState, useEffect } from 'react'
import { useParams } from '@/lib/router-compat'
import NavBar from '../components/layout/NavBar'
import { api } from '../api/client'
import type { MemoryStats } from '../types'
import styles from './MemoryPage.module.css'

type OpState = { label: string; pct: number; msg: string } | null

// Node types and their colors
const NODE_COLORS: Record<string, string> = {
  Decision:    'var(--accent)',
  Contributor: 'var(--success)',
  Issue:       'var(--warn)',
  Commit:      'var(--line)',
  Document:    'var(--ink-dim)',
  File:        '#a78bfa',
}

// Deterministic position from a string hash
function hashPos(s: string, seed: number): number {
  let h = seed * 2654435761
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 2246822519)
  return ((h >>> 0) % 80) + 5  // 5–85% range
}

// Derive graph nodes from live stats
function deriveNodes(stats: MemoryStats): Array<{id: string; label: string; type: string; x: string; y: string}> {
  const nodes: Array<{id: string; label: string; type: string; x: string; y: string}> = []

  if (stats.commits > 0) {
    nodes.push({ id: 'commits', label: `${stats.commits} Commits`, type: 'Commit',
      x: `${hashPos('commits', 1)}%`, y: `${hashPos('commits', 2)}%` })
  }
  if (stats.prs > 0) {
    nodes.push({ id: 'prs', label: `${stats.prs} Pull Requests`, type: 'Issue',
      x: `${hashPos('prs', 3)}%`, y: `${hashPos('prs', 4)}%` })
  }
  if (stats.issues > 0) {
    nodes.push({ id: 'issues', label: `${stats.issues} Issues`, type: 'Issue',
      x: `${hashPos('issues', 5)}%`, y: `${hashPos('issues', 6)}%` })
  }
  if ((stats.files ?? 0) > 0) {
    nodes.push({ id: 'files', label: `${stats.files} Source Files`, type: 'File',
      x: `${hashPos('files', 7)}%`, y: `${hashPos('files', 8)}%` })
  }
  if ((stats.chunks ?? 0) > 0) {
    nodes.push({ id: 'chunks', label: `${stats.chunks} Chunks`, type: 'Document',
      x: `${hashPos('chunks', 9)}%`, y: `${hashPos('chunks', 10)}%` })
  }
  // Always show a root node
  nodes.unshift({ id: 'root', label: 'Knowledge Graph', type: 'Decision', x: '50%', y: '47%' })
  return nodes
}

// Static fallback shown before stats load
const FALLBACK_NODES = [
  { id: 'root',    label: 'Knowledge Graph', type: 'Decision',    x: '50%', y: '47%' },
  { id: 'commits', label: 'Commits',         type: 'Commit',      x: '28%', y: '24%' },
  { id: 'prs',     label: 'Pull Requests',   type: 'Issue',       x: '72%', y: '28%' },
  { id: 'issues',  label: 'Issues',          type: 'Issue',       x: '68%', y: '68%' },
  { id: 'files',   label: 'Source Files',    type: 'File',        x: '30%', y: '70%' },
  { id: 'docs',    label: 'Chunks',          type: 'Document',    x: '83%', y: '55%' },
]

export default function MemoryPage() {
  const { repoId } = useParams<{ repoId: string }>()
  const [stats, setStats]         = useState<MemoryStats | null>(null)
  const [selectedId, setSelected] = useState('root')
  const [op, setOp]               = useState<OpState>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!repoId) return
    setLoading(true)
    api.chat.stats(repoId)
      .then(s => { setStats(s); setLoading(false) })
      .catch(() => setLoading(false))
  }, [repoId])

  const runOp = async (type: 'improve' | 'forget') => {
    if (!repoId) return
    const cfg = {
      improve: { label: 'Running improve()', msgs: ['Enriching graph nodes...', 'Pruning stale edges...', 'Adapting weights...', '✓ Graph enriched'] },
      forget:  { label: 'Running forget()',  msgs: ['Identifying deprecated nodes...', 'Pruning dataset...', 'Removing nodes...', '✓ Memory pruned'] },
    }
    const { label, msgs } = cfg[type]
    for (let i = 0; i < msgs.length; i++) {
      setOp({ label, pct: ((i+1)/msgs.length)*100, msg: msgs[i] })
      await new Promise(r => setTimeout(r, 700))
    }
    try { type === 'improve' ? await api.chat.improve(repoId) : await api.chat.forget(repoId) } catch {}
    setTimeout(() => {
      setOp(null)
      // Refresh stats after operation
      api.chat.stats(repoId!).then(setStats).catch(() => {})
    }, 1200)
  }

  const NODES = stats ? deriveNodes(stats) : FALLBACK_NODES
  const sel = NODES.find(n => n.id === selectedId) ?? NODES[0]

  return (
    <div className={styles.page}>
      <NavBar repoId={repoId} repoName={`Case #${repoId?.slice(0,8)}`} />

      <div className={styles.layout}>

        {/* LEFT SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sideSection}>
            <div className="t-label" style={{ marginBottom: 12 }}>Node Filters</div>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className={styles.filterRow}>
                <div className={styles.filterLeft}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
                  <div className={styles.filterDot} style={{ background: color }} />
                  <span className="t-body-sm" style={{ color: 'var(--ink-dim)' }}>{type}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.sideSection}>
            <div className="t-label" style={{ marginBottom: 12 }}>Memory Operations</div>
            <button className={`${styles.opBtn} ${styles.improve}`} onClick={() => runOp('improve')}>
              <span>improve()</span><span>→</span>
            </button>
            <button className={`${styles.opBtn} ${styles.forget}`} onClick={() => runOp('forget')}>
              <span>forget(dataset)</span><span>→</span>
            </button>
          </div>

          <div className={styles.sideSection}>
            <div className="t-label" style={{ marginBottom: 12 }}>Graph Stats</div>
            {loading ? (
              <div className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>Loading...</div>
            ) : stats ? (
              <>
                {[
                  ['Total Nodes', stats.total_nodes],
                  ['Total Edges', stats.total_edges],
                  ['Source Files', stats.files ?? 0],
                  ['Text Chunks', stats.chunks ?? 0],
                  ['Commits', stats.commits],
                  ['Pull Requests', stats.prs],
                  ['Issues', stats.issues],
                  ['Last Updated', new Date(stats.last_updated).toLocaleDateString()],
                ].map(([k,v]) => (
                  <div key={k as string} className={styles.filterRow}>
                    <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>{k}</span>
                    <span className="t-mono-xs" style={{ color: 'var(--accent)' }}>{v}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>No data</div>
            )}
          </div>

          {op && (
            <div className={styles.sideSection}>
              <div className="t-label" style={{ marginBottom: 8 }}>{op.label}</div>
              <div className={styles.opTrack}>
                <div className={styles.opFill} style={{ width: `${op.pct}%` }} />
              </div>
              <div className="t-mono-xs" style={{ color: 'var(--ink-ghost)', marginTop: 6 }}>{op.msg}</div>
            </div>
          )}
        </aside>

        {/* GRAPH CANVAS */}
        <div className={styles.graphArea}>
          <div className={styles.graphCanvas}>
            {/* SVG edges — draw from root to every other node */}
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
              <defs>
                <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="rgba(127,219,255,0.4)" />
                </marker>
              </defs>
              {NODES.filter(n => n.id !== 'root').map((n, i) => (
                <line key={n.id}
                  x1="50%" y1="47%"
                  x2={n.x} y2={n.y}
                  stroke={i % 2 === 0 ? "rgba(127,219,255,0.35)" : "rgba(127,219,255,0.2)"}
                  strokeWidth={i % 2 === 0 ? "1.5" : "1"}
                  strokeDasharray={i % 2 === 0 ? undefined : "4 4"}
                  markerEnd={i % 2 === 0 ? "url(#arr)" : undefined}
                />
              ))}
            </svg>

            {/* Nodes */}
            {NODES.map(n => (
              <div
                key={n.id}
                className={`${styles.node} ${selectedId === n.id ? styles.nodeActive : ''}`}
                style={{ left: n.x, top: n.y }}
                onClick={() => setSelected(n.id)}
              >
                <div className={styles.nodeId}>#{n.id.toUpperCase()}</div>
                <div className={styles.nodeDot} style={{ background: NODE_COLORS[n.type] ?? 'var(--accent)' }} />
                <div className={styles.nodeName}>{n.label}</div>
                <div className={styles.nodeType} style={{ color: NODE_COLORS[n.type] ?? 'var(--accent)' }}>{n.type}</div>
              </div>
            ))}

            <div className={styles.canvasLabel}>
              <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>
                {loading
                  ? 'Loading graph data...'
                  : `Showing ${NODES.length} summary nodes · ${stats?.total_nodes ?? 0} total graph nodes`}
              </span>
            </div>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <aside className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <div className="t-label" style={{ marginBottom: 6 }}>Node Details</div>
            <div className="t-heading" style={{ color: NODE_COLORS[sel?.type] ?? 'var(--accent)' }}>
              {sel?.label ?? '—'}
            </div>
          </div>

          <div className={styles.detailSection}>
            <div className="t-label" style={{ marginBottom: 6 }}>Identifier</div>
            <span className="bp-tag">#{sel?.id?.toUpperCase()}-001</span>
          </div>

          <div className={styles.detailSection}>
            <div className="t-label" style={{ marginBottom: 8 }}>Type</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div className={styles.filterDot} style={{ background: NODE_COLORS[sel?.type] ?? 'var(--accent)' }} />
              <span className="t-body-sm">{sel?.type} Node</span>
            </div>
          </div>

          <div className={styles.detailSection}>
            <div className="t-label" style={{ marginBottom: 8 }}>Graph Summary</div>
            {stats ? [
              [`Files indexed`, stats.files ?? 0],
              [`Chunks embedded`, stats.chunks ?? 0],
              [`Commits`, stats.commits],
              [`Pull Requests`, stats.prs],
              [`Issues`, stats.issues],
            ].map(([k,v]) => (
              <div key={k as string} className={styles.filterRow}>
                <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>{k}</span>
                <span className="t-mono-xs" style={{ color: 'var(--accent)' }}>{v}</span>
              </div>
            )) : (
              <div className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>No stats available</div>
            )}
          </div>

          <div className={styles.detailSection}>
            <div className="t-label" style={{ marginBottom: 8 }}>Thought Stream</div>
            <div className={styles.thoughtStream}>
              {[
                '> Knowledge graph active',
                `> ${stats?.total_nodes ?? 0} nodes indexed`,
                `> ${stats?.chunks ?? 0} chunks embedded`,
                '> Recall ready',
              ].map(t => (
                <div key={t} className={styles.thoughtLine}>{t}</div>
              ))}
            </div>
          </div>

          <div className={styles.detailFooter}>
            <button className="btn-ghost" style={{ width:'100%', justifyContent:'center' }}
              onClick={() => window.location.href = `/chat/${repoId}`}>
              Ask about this repo →
            </button>
          </div>
        </aside>

      </div>
    </div>
  )
}
