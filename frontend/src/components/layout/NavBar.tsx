import { Link, useLocation } from '@/lib/router-compat'
import styles from './NavBar.module.css'

interface NavBarProps {
  repoId?: string
  repoName?: string
}

export default function NavBar({ repoId, repoName }: NavBarProps) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header className={styles.nav}>
      <div className={styles.navLeft}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>L</span>
          <span className={styles.logoText}>LORE</span>
          <span className={styles.logoVersion}>v0.1</span>
        </Link>

        {repoName && (
          <>
            <div className={styles.separator} />
            <div className={styles.repoChip}>
              <div className="status-dot active" />
              <span className="t-mono-sm" style={{ color: 'var(--ink-dim)' }}>{repoName}</span>
            </div>
          </>
        )}
      </div>

      <nav className={styles.navCenter}>
        <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>
          // CODEBASE MEMORY · COGNEE GRAPH ONLINE
        </span>
      </nav>

      <div className={styles.navRight}>
        {repoId && (
          <>
            <Link to={`/chat/${repoId}`} className="btn-ghost">Chat</Link>
            <Link to={`/memory/${repoId}`} className="btn-ghost">Graph</Link>
          </>
        )}
        {isHome && (
          <Link to="/analyze" className="btn-primary" style={{ padding: '8px 20px', fontSize: '11px' }}>
            Open Case →
          </Link>
        )}
      </div>
    </header>
  )
}
