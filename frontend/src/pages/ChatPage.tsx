import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from '@/lib/router-compat'
import NavBar from '../components/layout/NavBar'
import { api } from '../api/client'
import type { Message, MemoryStats, Source } from '../types'
import styles from './ChatPage.module.css'

const SUGGESTIONS = [
  'Why was this architectural decision made?',
  'Who contributed the most impactful PRs?',
  'What bugs were hardest to fix and why?',
  'How has the codebase evolved over time?',
]

export default function ChatPage() {
  const { repoId } = useParams<{ repoId: string }>()
  const [messages, setMessages]       = useState<Message[]>([])
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [stats, setStats]             = useState<MemoryStats | null>(null)
  const [activeSources, setSources]   = useState<Source[]>([])
  const [queryCount, setQueryCount]   = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!repoId) return
    api.chat.stats(repoId).then(setStats).catch(() => {})
    setMessages([{
      id: 'welcome', role: 'lore',
      content: `Case opened. Fast Local Mode active for \`${repoId}\`. Ask me anything about this codebase's history, decisions, or contributors.`,
      timestamp: new Date(),
    }])
  }, [repoId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text?: string) => {
    const q = (text || input).trim()
    if (!q || loading || !repoId) return
    setInput('')
    setMessages(p => [...p, { id: Date.now().toString(), role: 'user', content: q, timestamp: new Date() }])
    setLoading(true)
    setQueryCount(c => c + 1)

    try {
      const res = await api.chat.query({ repo_id: repoId, question: q })
      setMessages(p => [...p, {
        id: (Date.now()+1).toString(), role: 'lore',
        content: res.answer, sources: res.sources, timestamp: new Date(),
      }])
      if (res.sources?.length) setSources(res.sources)
    } catch {
      setMessages(p => [...p, {
        id: (Date.now()+1).toString(), role: 'lore',
        content: 'Failed to query memory. Ensure the backend is running.',
        timestamp: new Date(),
      }])
    } finally { setLoading(false) }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className={styles.page}>
      <NavBar repoId={repoId} repoName={`Case #${repoId?.slice(0,8)}`} />

      <div className={styles.layout}>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sideSection}>
            <div className="t-label" style={{ marginBottom: 12 }}>Suggested Queries</div>
            {SUGGESTIONS.map(q => (
              <button key={q} className={styles.suggestion} onClick={() => send(q)}>{q}</button>
            ))}
          </div>

          {stats && (
            <div className={styles.sideSection}>
              <div className="t-label" style={{ marginBottom: 12 }}>Case Memory</div>
              {[
                ['Commits', stats.commits],
                ['Pull Requests', stats.prs],
                ['Issues', stats.issues],
                ['Graph Nodes', stats.total_nodes],
                ['Queries', queryCount],
              ].map(([k,v]) => (
                <div key={k as string} className={styles.statRow}>
                  <span className={styles.statKey}>{k}</span>
                  <span className="t-mono-xs" style={{ color: 'var(--accent)' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.sideSection}>
            <Link to={`/memory/${repoId}`} className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              View Memory Graph →
            </Link>
          </div>
        </aside>

        {/* CHAT */}
        <div className={styles.chatArea}>
          <div className={styles.messages}>
            {messages.map(msg => (
              <div key={msg.id} className={styles.msgWrapper}>
                {msg.role === 'user' ? (
                  <div className={styles.userRow}>
                    <div className={styles.userBubble}>{msg.content}</div>
                  </div>
                ) : (
                  <div className={styles.loreMsg}>
                    <div className={styles.loreMsgMeta}>
                      <span className={styles.loreBadge}>LORE</span>
                      <span className="t-mono-xs" style={{ color: 'var(--accent)', marginLeft: '8px' }}>
                        Fast Local Mode
                      </span>
                      {msg.sources && (
                        <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)', marginLeft: '12px' }}>
                          Local Vector Search · {msg.sources.length} sources
                        </span>
                      )}
                    </div>
                    <div className={`bp-card ${styles.loreMsgBody}`}>
                      <div className={styles.loreMsgText}>
                        {msg.content.split('`').map((part, i) =>
                          i % 2 === 1
                            ? <code key={i} className={styles.inlineCode}>{part}</code>
                            : part.split('**').map((p2, j) =>
                                j % 2 === 1 ? <strong key={j}>{p2}</strong> : p2
                              )
                        )}
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className={styles.evidenceRow}>
                          <span className="t-label">Sources</span>
                          {msg.sources.map(s => (
                            <span key={s.id} className="bp-tag" style={{ cursor: 'pointer' }}
                              onClick={() => setSources(msg.sources || [])}>
                              {s.type} {s.id}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className={styles.loreMsg}>
                <div className={styles.loreMsgMeta}>
                  <span className={styles.loreBadge}>LORE</span>
                  <span className="t-mono-xs" style={{ color: 'var(--accent)', marginLeft: '8px' }}>Fast Local Mode</span>
                  <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>searching vector store...</span>
                </div>
                <div className={`bp-card ${styles.loreMsgBody}`}>
                  <div className={styles.loreMsgText} style={{ color: 'var(--ink-ghost)', fontStyle: 'italic' }}>
                    Searching knowledge base
                    <span className={styles.dots}><span/><span/><span/></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className={styles.inputArea}>
            <div className={styles.inputWrap}>
              <textarea
                className={styles.chatInput}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything about this codebase's history..."
              />
              <button className={styles.sendBtn} onClick={() => send()} disabled={loading}>→</button>
            </div>
            <div className="t-mono-xs" style={{ color: 'var(--ink-ghost)', marginTop: 8 }}>
              ↵ Enter to send · Shift+↵ new line · Fast Local Mode active
            </div>
          </div>
        </div>

        {/* EVIDENCE PANEL */}
        <aside className={styles.evidencePanel}>
          <div className={styles.evidencePanelHeader}>
            <span className="t-label">Evidence Panel</span>
          </div>
          <div className={styles.evidenceItems}>
            {activeSources.length === 0 ? (
              <div className={styles.evidenceEmpty}>
                Sources appear here after your first query.
              </div>
            ) : activeSources.map(s => (
              <div key={s.id} className={styles.evidenceItem}>
                <div className="t-mono-xs" style={{ color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.type}</div>
                <div className="t-mono-sm" style={{ color: 'var(--ink)', marginBottom: 4 }}>{s.id}</div>
                <div className="t-body-sm" style={{ color: 'var(--ink-dim)' }}>{s.text}</div>
              </div>
            ))}
          </div>
        </aside>

      </div>
    </div>
  )
}