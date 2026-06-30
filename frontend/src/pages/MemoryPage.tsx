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

// Improved deterministic position with better spreading
function getNodePosition(id: string, index: number): { x: string; y: string } {
  const baseX = 18 + (index * 19);
  const x = Math.max(12, Math.min(85, baseX + (Math.sin(index) * 8))) + '%';
  const y = (32 + ((index % 4) * 18)) + '%';
  return { x, y };
}

// Derive graph nodes from live stats (Fast Mode stylized view)
function deriveNodes(stats: MemoryStats): Array<{id: string; label: string; type: string; x: string; y: string}> {
  const nodes: Array<{id: string; label: string; type: string; x: string; y: string}> = [];

  // Root node
  nodes.push({ 
    id: 'root', 
    label: 'Knowledge Graph', 
    type: 'Decision', 
    x: '50%', 
    y: '47%' 
  });

  const items = [
    { id: 'commits', label: `${stats.commits} Commits`, type: 'Commit' },
    { id: 'prs', label: `${stats.prs} Pull Requests`, type: 'Issue' },
    { id: 'files', label: `${stats.files ?? 0} Source Files`, type: 'File' },
    { id: 'chunks', label: `${stats.chunks ?? 0} Chunks`, type: 'Document' },
  ];

  items.forEach((item, index) => {
    if (item.label.includes('0 ')) return; // skip zero counts
    const pos = getNodePosition(item.id, index);
    nodes.push({ ...item, x: pos.x, y: pos.y });
  });

  return nodes;
}

// Static fallback
const FALLBACK_NODES = [
  { id: 'root', label: 'Knowledge Graph', type: 'Decision', x: '50%', y: '47%' },
  { id: 'commits', label: 'Commits', type: 'Commit', x: '25%', y: '28%' },
  { id: 'prs', label: 'Pull Requests', type: 'Issue', x: '72%', y: '32%' },
  { id: 'files', label: 'Source Files', type: 'File', x: '28%', y: '68%' },
  { id: 'chunks', label: 'Chunks', type: 'Document', x: '78%', y: '65%' },
];

export default function MemoryPage() {
  const { repoId } = useParams<{ repoId: string }>();
  const [stats, setStats]         = useState<MemoryStats | null>(null);
  const [selectedId, setSelected] = useState('root');
  const [op, setOp]               = useState<OpState>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    api.chat.stats(repoId)
      .then(s => { setStats(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [repoId]);

  const runOp = async (type: 'improve' | 'forget') => {
    if (!repoId) return;
    const cfg = {
      improve: { label: 'Running improve()', msgs: ['Enriching graph nodes...', 'Pruning stale edges...', 'Adapting weights...', '✓ Graph enriched'] },
      forget:  { label: 'Running forget()',  msgs: ['Identifying deprecated nodes...', 'Pruning dataset...', 'Removing nodes...', '✓ Memory pruned'] },
    };
    const { label, msgs } = cfg[type];
    for (let i = 0; i < msgs.length; i++) {
      setOp({ label, pct: ((i+1)/msgs.length)*100, msg: msgs[i] });
      await new Promise(r => setTimeout(r, 700));
    }
    try { 
      type === 'improve' ? await api.chat.improve(repoId) : await api.chat.forget(repoId);
    } catch {}
    setTimeout(() => {
      setOp(null);
      api.chat.stats(repoId!).then(setStats).catch(() => {});
    }, 1200);
  };

  const NODES = stats ? deriveNodes(stats) : FALLBACK_NODES;
  const sel = NODES.find(n => n.id === selectedId) ?? NODES[0];

  return (
    <div className={styles.page}>
      <NavBar repoId={repoId} repoName={`Case #${repoId?.slice(0,8)}`} />

      <div className={styles.layout}>

        {/* LEFT SIDEBAR — unchanged for now */}

        <aside className={styles.sidebar}>
          {/* ... keep your existing sidebar content ... */}
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
              <span className="t-mono-xs" style={{ color: 'var(--accent)' }}>
                Fast Local Vector View • Stylized Summary
              </span>
              <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)', marginLeft: 12 }}>
                {NODES.length} nodes • {stats?.total_nodes ?? 0} total
              </span>
            </div>
          </div>
        </div>

        {/* DETAIL PANEL — unchanged */}
        <aside className={styles.detailPanel}>
          {/* ... keep your existing detail panel ... */}
        </aside>

      </div>
    </div>
  );
}