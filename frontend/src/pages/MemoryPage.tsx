import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from '@/lib/router-compat'
import NavBar from '../components/layout/NavBar'
import { api } from '../api/client'
import type { MemoryStats, GraphApiResponse } from '../types'
import styles from './MemoryPage.module.css'

type OpState = { label: string; pct: number; msg: string; tone: 'default' | 'error' } | null
type RealEdge = { source: string; target: string; label?: string }

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
  const navigate = useNavigate();
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [selectedId, setSelected] = useState('root');
  const [op, setOp] = useState<OpState>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<any[]>([]);
  const [isRealGraph, setIsRealGraph] = useState(false);
  const [realEdges, setRealEdges] = useState<RealEdge[]>([]);
  const [fullGraphData, setFullGraphData] = useState<GraphApiResponse | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);

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
    setRealEdges(filteredEdges.map(e => ({ source: e.source, target: e.target, label: e.label })));
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

  // Keep the detail panel pointed at a node that actually exists in the
  // current (possibly filtered) node set.
  useEffect(() => {
    if (nodes.length === 0) return;
    if (!nodes.find(n => n.id === selectedId)) {
      setSelected(nodes[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

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
  const selectedNode = currentNodes.find(n => n.id === selectedId) ?? null;

  // Connections for the selected node — real edges in graph_mode, a simple
  // hub-and-spoke relationship in the synthetic Fast Vector view.
  const connections = selectedNode
    ? isRealGraph
      ? realEdges
          .filter(e => e.source === selectedId || e.target === selectedId)
          .map(e => {
            const otherId = e.source === selectedId ? e.target : e.source;
            const other = currentNodes.find(n => n.id === otherId);
            const direction: 'out' | 'in' = e.source === selectedId ? 'out' : 'in';
            return { id: otherId, label: other?.label ?? otherId, type: other?.type, direction, edgeLabel: e.label };
          })
      : selectedId === 'root'
        ? currentNodes.filter(n => n.id !== 'root').map(n => ({ id: n.id, label: n.label, type: n.type, direction: 'out' as const, edgeLabel: undefined }))
        : currentNodes.filter(n => n.id === 'root').map(n => ({ id: n.id, label: n.label, type: n.type, direction: 'in' as const, edgeLabel: undefined }))
    : [];

  const runImprove = async () => {
    if (!repoId || op) return;
    setOp({ label: 'improve()', pct: 12, msg: 'Enriching memory graph...', tone: 'default' });
    const tick = setInterval(() => setOp(p => (p && p.pct < 88 ? { ...p, pct: p.pct + 12 } : p)), 350);
    try {
      await api.chat.improve(repoId);
      clearInterval(tick);
      setOp({ label: 'improve()', pct: 100, msg: 'Memory graph enriched.', tone: 'default' });
      const s = await api.chat.stats(repoId);
      setStats(s);
      if (s.graph_mode) {
        const graph = await api.chat.graph(repoId);
        if (graph.graph_mode) {
          setFullGraphData(graph);
          applyGraphFilter(graph, activeTypes.size ? activeTypes : new Set(graph.nodes.map(n => n.type)), searchQuery);
        }
      }
    } catch {
      clearInterval(tick);
      setOp({ label: 'improve()', pct: 100, msg: 'Could not reach backend.', tone: 'error' });
    } finally {
      setTimeout(() => setOp(null), 2000);
    }
  };

  const runForget = async () => {
    if (!repoId || op) return;
    if (!window.confirm('This permanently deletes this case\u2019s memory. Continue?')) return;
    setOp({ label: 'forget(dataset)', pct: 25, msg: 'Pruning dataset...', tone: 'default' });
    try {
      await api.chat.forget(repoId);
      setOp({ label: 'forget(dataset)', pct: 100, msg: 'Memory dataset removed.', tone: 'default' });
      setTimeout(() => navigate('/analyze'), 1200);
    } catch {
      setOp({ label: 'forget(dataset)', pct: 100, msg: 'Could not reach backend.', tone: 'error' });
      setTimeout(() => setOp(null), 2000);
    }
  };

  return (
    <div className={styles.page}>
      <NavBar repoId={repoId} repoName={`Case #${repoId?.slice(0,8)}`} />

      <div className={styles.layout}>

        {/* LEFT: FILTERS + MEMORY OPERATIONS */}
        <aside className={styles.sidebar}>
          <div className={styles.sideSection}>
            <div className="t-label" style={{ marginBottom: 12 }}>Node Filters</div>

            {isRealGraph && fullGraphData ? (
              <>
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={styles.filterSearch}
                />
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <button onClick={() => setAllTypes(true)} className={styles.filterActionBtn}>All</button>
                  <button onClick={() => setAllTypes(false)} className={styles.filterActionBtn}>None</button>
                </div>
                {allTypes.map(type => (
                  <label key={type} className={styles.filterRow} style={{ cursor: 'pointer' }}>
                    <span className={styles.filterLeft}>
                      <span className={styles.filterDot} style={{ background: NODE_COLORS[type] ?? 'var(--ink-dim)', color: NODE_COLORS[type] ?? 'var(--ink-dim)' }} />
                      <span className="t-mono-xs" style={{ color: activeTypes.has(type) ? 'var(--ink)' : 'var(--ink-ghost)' }}>{type}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>{typeCounts[type]}</span>
                      <input type="checkbox" checked={activeTypes.has(type)} onChange={() => toggleType(type)} />
                    </span>
                  </label>
                ))}
              </>
            ) : (
              <>
                {Array.from(new Set(currentNodes.map(n => n.type))).map(type => (
                  <div key={type} className={styles.filterRow}>
                    <span className={styles.filterLeft}>
                      <span className={styles.filterDot} style={{ background: NODE_COLORS[type] ?? 'var(--ink-dim)', color: NODE_COLORS[type] ?? 'var(--ink-dim)' }} />
                      <span className="t-mono-xs">{type}</span>
                    </span>
                    <input type="checkbox" checked disabled />
                  </div>
                ))}
                <p className="t-body-sm" style={{ color: 'var(--ink-ghost)', marginTop: 10, lineHeight: 1.6 }}>
                  Per-type filtering is available once this case is ingested in Full Graph Mode.
                </p>
              </>
            )}
          </div>

          <div className={styles.sideSection}>
            <div className="t-label" style={{ marginBottom: 12 }}>Memory Operations</div>
            <button className={`${styles.opBtn} ${styles.improve}`} onClick={runImprove} disabled={!!op}>
              <span>improve()</span><span>→</span>
            </button>
            <button className={`${styles.opBtn} ${styles.forget}`} onClick={runForget} disabled={!!op}>
              <span>forget(dataset)</span><span>→</span>
            </button>
            {op && (
              <div style={{ marginTop: 10 }}>
                <div className={styles.opTrack}>
                  <div className={styles.opFill} style={{ width: `${op.pct}%`, background: op.tone === 'error' ? 'var(--error)' : undefined }} />
                </div>
                <p className="t-mono-xs" style={{ color: op.tone === 'error' ? 'var(--error)' : 'var(--ink-dim)', marginTop: 8 }}>{op.msg}</p>
              </div>
            )}
          </div>
        </aside>

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
                    <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.35)" />
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
                          stroke="rgba(255,255,255,0.22)"
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
                          stroke={i % 2 === 0 ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.16)"}
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
              <span className="t-mono-xs" style={{ color: 'var(--ink)' }}>
                {isRealGraph
                  ? `Full Graph (Cognee LLM) • ${nodes.length}${fullGraphData ? `/${fullGraphData.nodes.length}` : ''} nodes, ${realEdges.length} edges`
                  : 'Fast Local Vector View • Drag nodes to rearrange'}
              </span>
            </div>

            {isRealGraph && (
              <div className={styles.zoomControls}>
                <button
                  onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
                  className={styles.zoomBtn}
                >−</button>
                <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                  className={styles.zoomBtn}
                >+</button>
                <button
                  onClick={() => setZoom(1)}
                  className={styles.zoomResetBtn}
                >Reset</button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: NODE DETAILS */}
        <aside className={styles.detailPanel}>
          {loading ? (
            <div className={styles.detailHeader}>
              <span className="t-label">Node Details</span>
              <p className="t-body-sm" style={{ color: 'var(--ink-ghost)', marginTop: 10 }}>Loading memory graph...</p>
            </div>
          ) : selectedNode ? (
            <>
              <div className={styles.detailHeader}>
                <span className="t-label">Node Details</span>
                <h2 className="t-heading" style={{ color: 'var(--ink)', marginTop: 8 }}>{selectedNode.label}</h2>
              </div>

              <div className={styles.detailSection}>
                <span className="t-label" style={{ display: 'block', marginBottom: 8 }}>Identifier</span>
                <span className="bp-tag">#{selectedNode.id.toUpperCase()}</span>
              </div>

              <div className={styles.detailSection}>
                <span className="t-label" style={{ display: 'block', marginBottom: 8 }}>Type</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className={styles.filterDot} style={{ background: NODE_COLORS[selectedNode.type] ?? 'var(--ink-dim)', color: NODE_COLORS[selectedNode.type] ?? 'var(--ink-dim)' }} />
                  <span className="t-mono-sm" style={{ color: 'var(--ink)' }}>{selectedNode.type}</span>
                </span>
              </div>

              <div className={styles.detailSection}>
                <span className="t-label" style={{ display: 'block', marginBottom: 8 }}>Connections</span>
                {connections.length === 0 ? (
                  <p className="t-body-sm" style={{ color: 'var(--ink-ghost)' }}>No mapped connections.</p>
                ) : connections.map(c => (
                  <div key={c.id} className={styles.connItem} onClick={() => setSelected(c.id)}>
                    {c.direction === 'out' ? '→' : '←'} {c.label}
                    {c.edgeLabel ? <span style={{ color: 'var(--ink-ghost)' }}> · {c.edgeLabel}</span> : null}
                  </div>
                ))}
              </div>

              <div className={styles.detailSection} style={{ borderBottom: 'none' }}>
                <span className="t-label" style={{ display: 'block', marginBottom: 8 }}>Thought Stream</span>
                <div className={styles.thoughtStream}>
                  <div className={styles.thoughtLine}>&gt; Node type: {selectedNode.type}</div>
                  <div className={styles.thoughtLine}>&gt; {connections.length} connection{connections.length === 1 ? '' : 's'} mapped</div>
                  <div className={styles.thoughtLine}>&gt; Source: {isRealGraph ? 'Cognee LLM graph extraction' : 'Local vector index'}</div>
                </div>
              </div>

              <div className={styles.detailFooter}>
                <Link to={`/chat/${repoId}`} className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                  Ask about this node →
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.detailHeader}>
              <span className="t-label">Node Details</span>
              <p className="t-body-sm" style={{ color: 'var(--ink-ghost)', marginTop: 10 }}>Select a node to inspect its connections.</p>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
