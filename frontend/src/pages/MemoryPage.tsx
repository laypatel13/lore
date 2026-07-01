import { useState, useEffect } from 'react'
import { useParams } from '@/lib/router-compat'
import NavBar from '../components/layout/NavBar'
import { api } from '../api/client'
import type { MemoryStats, GraphApiResponse } from '../types'
import styles from './MemoryPage.module.css'

type OpState = { label: string; pct: number; msg: string } | null

const NODE_COLORS: Record<string, string> = {
  Decision:    'var(--accent)',
  Contributor: 'var(--success)',
  Issue:       'var(--warn)',
  Commit:      'var(--line)',
  Document:    'var(--ink-dim)',
  File:        '#a78bfa',
  // Real Cognee-extracted graph_mode types
  Entity:      '#a78bfa',
  TextSummary: 'var(--ink-dim)',
  Person:      'var(--success)',
};

// Real Cognee graph has no x/y — lay nodes out in a circle around center,
// then edges are drawn between whatever two nodes they actually connect
// (unlike the synthetic view, this isn't always root-to-leaf).
function deriveRealNodes(graph: GraphApiResponse) {
  const count = Math.max(graph.nodes.length, 1);
  // Wider radius for more nodes so cards don't overlap; cap it so it doesn't
  // run off-screen on huge graphs.
  const radius = Math.min(46, 20 + count * 1.1);
  const nodes = graph.nodes.map((n, i) => {
    const angle = (i / count) * 2 * Math.PI;
    const x = `${50 + radius * Math.cos(angle)}%`;
    const y = `${50 + radius * Math.sin(angle)}%`;
    return { id: n.id, label: n.label, type: n.type, x, y };
  });
  return nodes;
}

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
  const [isRealGraph, setIsRealGraph] = useState(false);
  const [realEdges, setRealEdges] = useState<{ source: string; target: string }[]>([]);
  const [fullGraphData, setFullGraphData] = useState<GraphApiResponse | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [panelOpen, setPanelOpen] = useState(true);

  // Cognee's raw graph mixes real extracted entities (Entity, EntityType)
  // with internal document-processing bookkeeping (DocumentChunk,
  // TextSummary, TextDocument). Default view hides the bookkeeping.
  const STRUCTURAL_TYPES = new Set(['DocumentChunk', 'TextSummary', 'TextDocument']);

  // Count of nodes per type, for the filter panel checkboxes
  const typeCounts = fullGraphData
    ? fullGraphData.nodes.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};
  const allTypes = Object.keys(typeCounts).sort();

  const applyGraphFilter = (graph: GraphApiResponse, types: Set<string>, query: string) => {
    const q = query.trim().toLowerCase();
    const filteredNodes = graph.nodes.filter(n =>
      types.has(n.type) && (q === '' || n.label.toLowerCase().includes(q))
    );
    const keepIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graph.edges.filter(e => keepIds.has(e.source) && keepIds.has(e.target));
    setNodes(deriveRealNodes({ ...graph, nodes: filteredNodes }));
    setRealEdges(filteredEdges.map(e => ({ source: e.source, target: e.target })));
  };

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    api.chat.stats(repoId)
      .then(async (s) => {
        setStats(s);

        if (s.graph_mode) {
          try {
            const graph = await api.chat.graph(repoId);
            if (graph.graph_mode && graph.nodes.length > 0) {
              setFullGraphData(graph);
              const defaultTypes = new Set(
                Array.from(new Set(graph.nodes.map(n => n.type))).filter(t => !STRUCTURAL_TYPES.has(t))
              );
              setActiveTypes(defaultTypes);
              applyGraphFilter(graph, defaultTypes, '');
              setIsRealGraph(true);
              setLoading(false);
              return;
            }
          } catch {
            // fall through to synthetic view below
          }
        }

        // Fast Mode, or graph fetch failed/empty — use the stylized summary view
        setNodes(deriveNodes(s));
        setIsRealGraph(false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [repoId]);

  const toggleType = (type: string) => {
    if (!fullGraphData) return;
    const next = new Set(activeTypes);
    if (next.has(type)) next.delete(type); else next.add(type);
    setActiveTypes(next);
    applyGraphFilter(fullGraphData, next, searchQuery);
  };

  const setAllTypes = (on: boolean) => {
    if (!fullGraphData) return;
    const next = on ? new Set(allTypes) : new Set<string>();
    setActiveTypes(next);
    applyGraphFilter(fullGraphData, next, searchQuery);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!fullGraphData) return;
    applyGraphFilter(fullGraphData, activeTypes, query);
  };

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
          <div
            className={styles.graphCanvas}
            onWheel={(e) => {
              if (!isRealGraph) return;
              e.preventDefault();
              setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s ease-out',
            }}>
              {/* Dynamic SVG edges */}
              <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
                <defs>
                  <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="rgba(127,219,255,0.4)" />
                  </marker>
                </defs>
                {isRealGraph
                  ? realEdges.map((e, i) => {
                      const source = currentNodes.find(n => n.id === e.source);
                      const target = currentNodes.find(n => n.id === e.target);
                      if (!source || !target) return null;
                      return (
                        <line
                          key={`${e.source}-${e.target}-${i}`}
                          x1={source.x} y1={source.y}
                          x2={target.x} y2={target.y}
                          stroke="rgba(127,219,255,0.3)"
                          strokeWidth="1.2"
                          markerEnd="url(#arr)"
                        />
                      );
                    })
                  : currentNodes.filter(n => n.id !== 'root').map((n, i) => {
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
            </div>

            <div className={styles.canvasLabel}>
              <span className="t-mono-xs" style={{ color: 'var(--accent)' }}>
                {isRealGraph
                  ? `Full Graph (Cognee LLM) • ${nodes.length}${fullGraphData ? `/${fullGraphData.nodes.length}` : ''} nodes, ${realEdges.length} edges`
                  : 'Fast Local Vector View • Drag nodes to rearrange'}
              </span>
            </div>

            {isRealGraph && (
              <div style={{
                position: 'absolute', bottom: '12px', right: '12px',
                display: 'flex', gap: '4px', alignItems: 'center',
              }}>
                <button
                  onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
                  className="t-mono-xs"
                  style={{ background: 'rgba(11,22,44,0.9)', border: '1px solid var(--accent)', borderRadius: '4px', color: 'var(--accent)', width: '28px', height: '28px', cursor: 'pointer' }}
                >−</button>
                <span className="t-mono-xs" style={{ color: 'var(--ink-dim)', width: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                  className="t-mono-xs"
                  style={{ background: 'rgba(11,22,44,0.9)', border: '1px solid var(--accent)', borderRadius: '4px', color: 'var(--accent)', width: '28px', height: '28px', cursor: 'pointer' }}
                >+</button>
                <button
                  onClick={() => setZoom(1)}
                  className="t-mono-xs"
                  style={{ background: 'rgba(11,22,44,0.9)', border: '1px solid var(--accent)', borderRadius: '4px', color: 'var(--accent)', padding: '4px 8px', cursor: 'pointer' }}
                >Reset</button>
              </div>
            )}

            {/* Filter control panel */}
            {isRealGraph && fullGraphData && (
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                background: 'rgba(11,22,44,0.95)', border: '1px solid var(--accent)',
                borderRadius: '6px', padding: panelOpen ? '12px' : '6px 10px',
                maxWidth: '220px', maxHeight: panelOpen ? '70vh' : 'auto', overflowY: 'auto',
              }}>
                <div
                  onClick={() => setPanelOpen(!panelOpen)}
                  className="t-mono-xs"
                  style={{ color: 'var(--accent)', cursor: 'pointer', marginBottom: panelOpen ? '8px' : 0, fontWeight: 'bold' }}
                >
                  {panelOpen ? '▾ Filter Nodes' : '▸ Filter'}
                </div>
                {panelOpen && (
                  <>
                    <input
                      type="text"
                      placeholder="Search nodes..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="t-mono-xs"
                      style={{
                        width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)',
                        borderRadius: '4px', color: 'var(--ink)', padding: '4px 6px', marginBottom: '8px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <button onClick={() => setAllTypes(true)} className="t-mono-xs" style={{ background: 'transparent', border: '1px solid var(--line)', borderRadius: '3px', color: 'var(--ink-dim)', padding: '2px 6px', cursor: 'pointer', fontSize: '10px' }}>All</button>
                      <button onClick={() => setAllTypes(false)} className="t-mono-xs" style={{ background: 'transparent', border: '1px solid var(--line)', borderRadius: '3px', color: 'var(--ink-dim)', padding: '2px 6px', cursor: 'pointer', fontSize: '10px' }}>None</button>
                    </div>
                    {allTypes.map(type => (
                      <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={activeTypes.has(type)}
                          onChange={() => toggleType(type)}
                        />
                        <span
                          className="t-mono-xs"
                          style={{ color: NODE_COLORS[type] ?? 'var(--ink-dim)', fontSize: '11px' }}
                        >
                          {type} ({typeCounts[type]})
                        </span>
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel (keep your existing) */}

      </div>
    </div>
  );
}