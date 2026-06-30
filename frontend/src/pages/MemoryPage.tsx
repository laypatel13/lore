import { useState, useEffect } from 'react'
import { useParams } from '@/lib/router-compat'
import NavBar from '../components/layout/NavBar'
import { api } from '../api/client'
import type { MemoryStats } from '../types'
import styles from './MemoryPage.module.css'

type OpState = { label: string; pct: number; msg: string } | null

const NODE_COLORS: Record<string, string> = {
  Decision:    'var(--accent)',
  Contributor: 'var(--success)',
  Issue:       'var(--warn)',
  Commit:      'var(--line)',
  Document:    'var(--ink-dim)',
  File:        '#a78bfa',
};

function deriveNodes(stats: MemoryStats) {
  const nodes = [];
  let xOffset = 22;

  nodes.push({ id: 'root', label: 'Structure Graph', type: 'Decision', x: '50%', y: '47%' });

  const items = [
    { id: 'commits', label: `${stats.commits} Commits`, type: 'Commit' },
    { id: 'prs', label: `${stats.prs} Pull Requests`, type: 'Issue' },
    { id: 'files', label: `${stats.files ?? 0} Source Files`, type: 'File' },
    { id: 'chunks', label: `${stats.chunks ?? 0} Chunks`, type: 'Document' },
  ];

  items.forEach((item, index) => {
    if (item.label.includes('0 ')) return;
    const x = `${Math.max(12, Math.min(85, xOffset + (index * 19)))}%`;
    const y = `${28 + ((index % 4) * 18)}%`;
    nodes.push({ ...item, x, y });
  });

  return nodes;
}

export default function MemoryPage() {
  const { repoId } = useParams<{ repoId: string }>();
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [selectedId, setSelected] = useState('root');
  const [op, setOp] = useState<OpState>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<any[]>([]);

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    api.chat.stats(repoId)
      .then(s => { 
        setStats(s); 
        setNodes(deriveNodes(s)); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [repoId]);

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const nodeIndex = nodes.findIndex(n => n.id === id);
    if (nodeIndex === -1) return;

    const startLeft = parseFloat(nodes[nodeIndex].x);
    const startTop = parseFloat(nodes[nodeIndex].y);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
      const dy = ((moveEvent.clientY - startY) / window.innerHeight) * 100;
      
      setNodes(prev => prev.map((n, i) => 
        i === nodeIndex 
          ? { ...n, x: `${Math.max(5, Math.min(95, startLeft + dx))}%`, y: `${Math.max(5, Math.min(95, startTop + dy))}%` }
          : n
      ));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const currentNodes = nodes.length > 0 ? nodes : deriveNodes(stats || { commits: 0, prs: 0, issues: 0, files: 0, chunks: 0 } as any);

  return (
    <div className={styles.page}>
      <NavBar repoId={repoId} repoName={`Case #${repoId?.slice(0,8)}`} />

      <div className={styles.layout}>

        {/* Sidebar (unchanged) */}

        {/* GRAPH CANVAS */}
        <div className={styles.graphArea}>
          <div className={styles.graphCanvas}>
            {/* Dynamic SVG edges */}
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
              <defs>
                <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="rgba(127,219,255,0.4)" />
                </marker>
              </defs>
              {currentNodes.filter(n => n.id !== 'root').map((n, i) => {
                const root = currentNodes.find(r => r.id === 'root');
                return (
                  <line 
                    key={n.id}
                    x1={root?.x || '50%'} 
                    y1={root?.y || '47%'}
                    x2={n.x} 
                    y2={n.y}
                    stroke={i % 2 === 0 ? "rgba(127,219,255,0.35)" : "rgba(127,219,255,0.2)"}
                    strokeWidth={i % 2 === 0 ? "1.5" : "1"}
                    strokeDasharray={i % 2 === 0 ? undefined : "4 4"}
                    markerEnd={i % 2 === 0 ? "url(#arr)" : undefined}
                  />
                );
              })}
            </svg>

            {/* Draggable Nodes */}
            {currentNodes.map(n => (
              <div
                key={n.id}
                className={`${styles.node} ${selectedId === n.id ? styles.nodeActive : ''}`}
                style={{ left: n.x, top: n.y, cursor: 'grab' }}
                onMouseDown={(e) => handleMouseDown(n.id, e)}
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
                Fast Local Vector View • Drag nodes to rearrange
              </span>
            </div>
          </div>
        </div>

        {/* Detail Panel (keep your existing) */}

      </div>
    </div>
  );
}