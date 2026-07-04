import type { ReactNode } from 'react'

/**
 * Cognee/Groq/Gemini answers come back with light markdown — **bold**,
 * `inline code`, and \n\n paragraph breaks. Chat messages were rendering
 * this as a raw string via {msg.content}, so it displayed literal
 * asterisks and backticks instead of formatting. This is a deliberately
 * minimal, dependency-free renderer — not a full markdown parser — since
 * that's genuinely all the answer synthesis prompts ever produce.
 */
export function renderLiteMarkdown(text: string): ReactNode {
  const paragraphs = text.split(/\n\n+/)

  return paragraphs.map((para, pi) => (
    <p key={pi} style={{ margin: pi === 0 ? 0 : '10px 0 0 0' }}>
      {renderInline(para)}
    </p>
  ))
}

function renderInline(text: string): ReactNode[] {
  // Split on **bold** and `code` while keeping the delimiters, so we can
  // alternate between plain text and styled spans in order.
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i}>{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={i} style={{
          fontFamily: 'var(--font-mono)',
          background: 'var(--surface-2)',
          padding: '1px 6px',
          borderRadius: 4,
          fontSize: '0.9em',
        }}>
          {token.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{token}</span>
  })
}
