import { useState, useEffect } from 'react'
import { useParams } from '@/lib/router-compat'
import NavBar from '../components/layout/NavBar'
import { api } from '../api/client'
import type { MemoryStats } from '../types'
import styles from './MemoryPage.module.css'

type OpState = { label: string; pct: number; msg: string } | null

const NODES = [
  { id: 'core',    label: 'App Router',     type: 'Decision',    x: '50%', y: '47%' },
  { id: 'contrib', label: '@timneutkens',   type: 'Contributor', x: '28%', y: '24%' },
  { id: 'issue',   label: 'Hydration Bug',  type: 'Issue',       x: '72%', y: '28%' },
  { id: 'commit',  label: 'Turbopack Init', type: 'Commit',      x: '68%', y: '68%' },
  { id: 'doc',     label: 'Build RFC',      type: 'Document',    x: '83%', y: '55%' },
  { id: 'sokra',   label: '@sokra',         type: 'Contributor', x: '16%', y: '40%' },
  { id: 'perf',    label: 'Perf Report',    type: 'Issue',       x: '30%', y: '70%' },
]

const NODE_COLORS: Record<string, string> = {
  Decision:    'var(--accent)',
  Contributor: 'var(--success)',
  Issue:       'var(--warn)',
  Commit:      'var(--line)',
  Document:    'var(--ink-dim)',
}

export default function MemoryPage() {
  const { repoId } = useParams<{ repoId: string }>()
  const [stats, setStats]         = useState<MemoryStats | null>(null)
  const [selectedId, setSelected] = useState('core')
  const [op, setOp]               = useState<OpState>(null)

  useEffect(() => {
    if (!repoId) return
    api.chat.stats(repoId).then(setStats).catch(() => {})
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
    setTimeout(() => setOp(null), 1200)
  }

  const sel = NODES.find(n => n.id === selectedId)!

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

          {stats && (
            <div className={styles.sideSection}>
              <div className="t-label" style={{ marginBottom: 12 }}>Graph Stats</div>
              {[
                ['Total Nodes', stats.total_nodes],
                ['Total Edges', stats.total_edges],
                ['Last Updated', new Date(stats.last_updated).toLocaleDateString()],
              ].map(([k,v]) => (
                <div key={k as string} className={styles.filterRow}>
                  <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>{k}</span>
                  <span className="t-mono-xs" style={{ color: 'var(--accent)' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

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
            {/* SVG edges */}
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
              <defs>
                <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="rgba(127,219,255,0.4)" />
                </marker>
              </defs>
              <line x1="50%" y1="47%" x2="28%" y2="24%" stroke="rgba(127,219,255,0.35)" strokeWidth="1.5" markerEnd="url(#arr)" />
              <line x1="50%" y1="47%" x2="72%" y2="28%" stroke="rgba(127,219,255,0.2)"  strokeWidth="1" strokeDasharray="4 4" />
              <line x1="50%" y1="47%" x2="68%" y2="68%" stroke="rgba(127,219,255,0.4)"  strokeWidth="2" markerEnd="url(#arr)" />
              <line x1="68%" y1="68%" x2="83%" y2="55%" stroke="rgba(127,219,255,0.2)"  strokeWidth="1" strokeDasharray="3 5" />
              <line x1="28%" y1="24%" x2="16%" y2="40%" stroke="rgba(127,219,255,0.2)"  strokeWidth="1" />
              <line x1="50%" y1="47%" x2="30%" y2="70%" stroke="rgba(127,219,255,0.2)"  strokeWidth="1" strokeDasharray="4 4" />
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
                <div className={styles.nodeDot} style={{ background: NODE_COLORS[n.type] }} />
                <div className={styles.nodeName}>{n.label}</div>
                <div className={styles.nodeType} style={{ color: NODE_COLORS[n.type] }}>{n.type}</div>
              </div>
            ))}

            <div className={styles.canvasLabel}>
              <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>
                Showing {NODES.length} of {stats?.total_nodes ?? '…'} nodes
              </span>
            </div>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <aside className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <div className="t-label" style={{ marginBottom: 6 }}>Node Details</div>
            <div className="t-heading" style={{ color: NODE_COLORS[sel.type] }}>{sel.label}</div>
          </div>

          <div className={styles.detailSection}>
            <div className="t-label" style={{ marginBottom: 6 }}>Identifier</div>
            <span className="bp-tag">#{sel.id.toUpperCase()}-001</span>
          </div>

          <div className={styles.detailSection}>
            <div className="t-label" style={{ marginBottom: 8 }}>Type</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div className={styles.filterDot} style={{ background: NODE_COLORS[sel.type] }} />
              <span className="t-body-sm">{sel.type} Node</span>
            </div>
          </div>

          <div className={styles.detailSection}>
            <div className="t-label" style={{ marginBottom: 8 }}>Connections</div>
            {['→ PR #51203 (Strong)', '→ Issue #42847 (Medium)', '→ commit a3f9b2c (Weak)'].map(c => (
              <div key={c} className={styles.connItem}>{c}</div>
            ))}
          </div>

          <div className={styles.detailSection}>
            <div className="t-label" style={{ marginBottom: 8 }}>Thought Stream</div>
            <div className={styles.thoughtStream}>
              {['> Memory node initialized', '> Linked to 3 edges', '> High recall frequency', '> Last queried: recently'].map(t => (
                <div key={t} className={styles.thoughtLine}>{t}</div>
              ))}
            </div>
          </div>

          <div className={styles.detailFooter}>
            <button className="btn-ghost" style={{ width:'100%', justifyContent:'center' }}
              onClick={() => window.location.href = `/chat/${repoId}`}>
              Ask about this node →
            </button>
          </div>
        </aside>

      </div>
    </div>
  )
}
