import { Link } from '@/lib/router-compat'
import NavBar from '../components/layout/NavBar'
import SpecBox from '../components/ui/SpecBox'
import styles from './LandingPage.module.css'

const OPS = [
  { fn: 'remember()', color: '#4ADE80', desc: 'Ingest commits, PRs, and issues into the knowledge graph. Every decision, permanently mapped.' },
  { fn: 'recall()',   color: '#7FDBFF', desc: 'Ask anything. Cognee routes between semantic search and graph traversal to surface the right answer.' },
  { fn: 'improve()', color: '#FBBF24', desc: 'Enrich memory after new commits. Prune stale nodes. The graph sharpens as your codebase grows.' },
  { fn: 'forget()',  color: '#F87171', desc: 'Surgically remove deprecated branches or outdated context from persistent memory.' },
]

const STEPS = [
  { n: '01', title: 'Point Lore at your repo', body: 'Paste any public GitHub URL. Lore ingests every commit, PR, issue, and comment — the full institutional history of your codebase.', code: 'await cognee.remember(repo_url)' },
  { n: '02', title: 'Cognee builds the graph', body: 'History is structured into a hybrid graph-vector knowledge graph. Relationships between decisions, contributors, and code are permanently mapped.', code: 'graph + vector → knowledge' },
  { n: '03', title: 'Query forever', body: 'Ask anything about your codebase\'s past. Memory persists across infinite sessions — context never dies, every answer cites its sources.', code: 'await cognee.recall(question)' },
]

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <NavBar />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroLeft}>
            <div className={styles.eyebrow}>
              <div className="status-dot active" />
              <span className="t-mono-xs">MEMORY ACTIVE · COGNEE GRAPH ONLINE</span>
            </div>

            <h1 className={`t-display-xl ${styles.headline}`}>
              Your codebase<br />
              <span className={styles.accentWord}>remembers.</span><br />
              Finally.
            </h1>

            <p className={`t-body-lg ${styles.subline}`}>
              Every commit hides a decision. Every PR buries a reason.
              Lore gives your codebase a persistent memory — so you can
              interrogate the past, any time, forever.
            </p>

            <div className={styles.heroActions}>
              <Link to="/analyze" className="btn-primary">Open a Case →</Link>
              <a href="#process" className="btn-secondary">How it works</a>
            </div>
          </div>

          {/* CASE FILE DEMO */}
          <div className={styles.caseFile}>
            <div className={styles.caseFileHeader}>
              <div className={styles.caseFileMeta}>
                <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>CASE FILE</span>
                <span className="t-mono-sm" style={{ color: 'var(--ink-dim)' }}>#0042</span>
              </div>
              <div className={styles.caseFileStatus}>
                <div className="status-dot active" />
                <span className="t-mono-xs" style={{ color: 'var(--success)' }}>MEMORY ACTIVE</span>
              </div>
            </div>

            <div className={styles.caseFileBody}>
              <div className={styles.repoLine}>
                <span className="t-label">Repository</span>
                <span className="t-mono-sm" style={{ color: 'var(--ink)' }}>vercel/next.js</span>
              </div>

              <div className={styles.queryBlock}>
                <div className="t-label" style={{ marginBottom: 8 }}>Query</div>
                <p className={styles.queryText}>
                  "Why did we switch from Webpack to Turbopack in 2023?"
                </p>
              </div>

              <p className={styles.answerText}>
                The migration was triggered by <strong>build time complaints</strong> across
                47 open issues. Benchmarks in <strong>PR #51203</strong> confirmed{' '}
                <strong>10x faster cold starts</strong>. Decision authored by{' '}
                <strong>@timneutkens</strong> in RFC Sept 14, 2023.
                <span className={styles.cursor} />
              </p>

              <div className={styles.evidenceDivider} />
              <div className="t-label" style={{ marginBottom: 8 }}>Evidence</div>
              <div className={styles.evidenceRow}>
                {['issue #42847', 'PR #51203', 'commit a3f9b2c', 'RFC Sept 2023'].map(e => (
                  <span key={e} className="bp-tag">{e}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className={styles.statsStrip}>
        {[
          { val: '∞', label: 'Sessions remembered' },
          { val: '4',   label: 'Memory operations' },
          { val: 'Any', label: 'Public GitHub repo' },
          { val: '0',   label: 'Context lost' },
        ].map(s => (
          <div key={s.label} className={styles.statCell}>
            <div className={styles.statVal}>{s.val}</div>
            <div className="t-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section className={styles.section} id="process">
        <div className="container">
          <div className={styles.sectionEyebrow}>
            <span className="t-label">// The Process</span>
            <div className={styles.sectionRule} />
          </div>
          <h2 className={`t-display-md ${styles.sectionTitle}`}>Three steps. Total recall.</h2>
          <div className={styles.stepsGrid}>
            {STEPS.map(s => (
              <div key={s.n} className={`bp-card ${styles.step}`}>
                <div className={styles.stepNum}>{s.n}</div>
                <div className={`t-heading ${styles.stepTitle}`}>{s.title}</div>
                <p className={`t-body-sm ${styles.stepBody}`}>{s.body}</p>
                <code className={styles.stepCode}>{s.code}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMORY OPS */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionEyebrow}>
            <span className="t-label">// Memory Lifecycle</span>
            <div className={styles.sectionRule} />
          </div>
          <h2 className={`t-display-md ${styles.sectionTitle}`}>Four operations.<br />Nothing forgotten.</h2>
          <div className={styles.opsGrid}>
            {OPS.map(op => (
              <SpecBox key={op.fn} label={op.fn}>
                <div className={styles.opFn} style={{ color: op.color }}>{op.fn}</div>
                <p className="t-body-sm" style={{ color: 'var(--ink-dim)', lineHeight: 1.65 }}>{op.desc}</p>
              </SpecBox>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className={styles.ctaEyebrow}>
            <span className="t-label">// Open a Case · Free · No Setup</span>
          </div>
          <h2 className={`t-display-lg ${styles.ctaTitle}`}>
            What does your<br />
            <span className={styles.accentWord}>codebase know?</span>
          </h2>
          <p className="t-body" style={{ color: 'var(--ink-dim)', marginBottom: 40 }}>
            Paste a GitHub URL. Lore handles the rest.
          </p>
          <Link to="/analyze" className="btn-primary" style={{ fontSize: '13px', padding: '13px 36px' }}>
            Open a Case →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <span className={styles.logoMark}>L</span>
          <span className={styles.footerLogoText}>LORE</span>
        </div>
        <span className="t-mono-xs" style={{ color: 'var(--ink-ghost)' }}>
          // memory powered by cognee · wemakedevs hackathon 2026
        </span>
      </footer>
    </div>
  )
}
