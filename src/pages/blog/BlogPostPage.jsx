import { useParams, useNavigate, Link } from 'react-router-dom'
import MarketingLayout, { T, FONT, MarketingCTA } from '../MarketingLayout.jsx'
import useSEO from '../../hooks/useSEO.js'
import { BLOG_POSTS, BLOG_LIST } from './blogData.js'

function NotFound({ navigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '120px 32px' }}>
      <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 16 }}>404</div>
      <p style={{ color: T.muted, marginBottom: 32 }}>Post not found.</p>
      <button onClick={() => navigate('/blog')} style={{ padding: '12px 28px', background: T.btnGray, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT, fontSize: 12 }}>
        ← Blog
      </button>
    </div>
  )
}

function parseMarkdownTable(text) {
  const lines = text.split('\n').filter(l => l.trim().startsWith('|'))
  if (lines.length < 2) return null
  const headers = lines[0].split('|').filter(Boolean).map(h => h.trim())
  const rows = lines.slice(2).map(l => l.split('|').filter(Boolean).map(c => c.trim()))
  return { headers, rows }
}

function RichBody({ text }) {
  const parts = text.split(/(\n\n|\n(?=- |\d+\. |\*\*)|(?<=\n\n))/g)
  const blocks = []
  let i = 0
  const lines = text.split('\n')

  // Detect markdown table blocks
  const tableRegex = /(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g
  let cursor = 0
  let match
  const segments = []

  while ((match = tableRegex.exec(text)) !== null) {
    if (match.index > cursor) segments.push({ type: 'text', content: text.slice(cursor, match.index) })
    segments.push({ type: 'table', content: match[0] })
    cursor = match.index + match[0].length
  }
  if (cursor < text.length) segments.push({ type: 'text', content: text.slice(cursor) })

  return (
    <div>
      {segments.map((seg, si) => {
        if (seg.type === 'table') {
          const parsed = parseMarkdownTable(seg.content)
          if (!parsed) return null
          return (
            <div key={si} style={{ overflowX: 'auto', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {parsed.headers.map((h, hi) => (
                      <th key={hi} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: T.dim, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: `1px solid ${T.border}`, background: ri % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ padding: '10px 14px', fontSize: 13, color: ci === 0 ? T.text : T.muted, lineHeight: 1.6 }}
                          dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        // Process text segment paragraph by paragraph
        const paragraphs = seg.content.split(/\n\n+/)
        return paragraphs.map((para, pi) => {
          const trimmed = para.trim()
          if (!trimmed) return null

          // Bullet list
          const bulletLines = trimmed.split('\n').filter(l => l.startsWith('- '))
          if (bulletLines.length > 0 && bulletLines.length === trimmed.split('\n').length) {
            return (
              <ul key={`${si}-${pi}`} style={{ paddingLeft: 20, marginBottom: 20 }}>
                {bulletLines.map((l, li) => (
                  <li key={li} style={{ fontSize: 15, color: T.muted, lineHeight: 1.75, marginBottom: 6 }}
                    dangerouslySetInnerHTML={{ __html: l.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong style="color:rgba(255,255,255,0.85)">$1</strong>') }}
                  />
                ))}
              </ul>
            )
          }

          // Plain paragraph with bold
          return (
            <p key={`${si}-${pi}`} style={{ fontSize: 15, color: T.muted, lineHeight: 1.8, marginBottom: 20 }}
              dangerouslySetInnerHTML={{
                __html: trimmed
                  .replace(/\*\*(.+?)\*\*/g, '<strong style="color:rgba(255,255,255,0.85)">$1</strong>')
                  .replace(/\n/g, '<br/>')
              }}
            />
          )
        })
      })}
    </div>
  )
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const post = BLOG_POSTS[slug]

  useSEO({
    title:       post?.seoTitle   || 'Blog — Lumina Design',
    description: post?.seoDesc   || '',
    canonical:   post?.canonical || `https://app.lightillumina.com/blog/${slug}`,
  })

  if (!post) return <MarketingLayout><NotFound navigate={navigate} /></MarketingLayout>

  const related = BLOG_LIST.filter(p => p.slug !== post.slug).slice(0, 2)

  // JSON-LD Article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seoDesc,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: 'Lumina Design',
      url: 'https://app.lightillumina.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lumina Design',
      url: 'https://app.lightillumina.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.canonical,
    },
  }

  return (
    <MarketingLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      {/* Breadcrumb */}
      <div style={{ padding: '16px 48px', borderBottom: `1px solid ${T.border}` }}>
        <span onClick={() => navigate('/blog')} style={{ fontSize: 11, color: T.dim, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          onMouseEnter={e => e.currentTarget.style.color = T.muted}
          onMouseLeave={e => e.currentTarget.style.color = T.dim}
        >← Blog</span>
      </div>

      {/* Hero */}
      <header style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 48px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', color: T.dim, textTransform: 'uppercase', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 3 }}>{post.category}</span>
          <span style={{ fontSize: 12, color: T.dim }}>{post.readTime}</span>
          <span style={{ fontSize: 12, color: T.dim }}>·</span>
          <span style={{ fontSize: 12, color: T.dim }}>{new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 20 }}>{post.title}</h1>
        <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.75 }}>{post.excerpt}</p>
      </header>

      {/* Article body */}
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 48 }}>
          {post.sections.map((section, i) => (
            <section key={i} style={{ marginBottom: 48, paddingBottom: 48, borderBottom: `1px solid ${T.border}` }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, lineHeight: 1.3 }}>{section.heading}</h2>
              <RichBody text={section.body} />
            </section>
          ))}
        </div>

        {/* FAQ */}
        {post.faq?.length > 0 && (
          <section style={{ marginBottom: 64 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 28 }}>Frequently asked questions</h2>
            {post.faq.map((item, i) => (
              <div key={i} style={{ padding: '18px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>{item.q}</div>
                <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.8 }}>{item.a}</div>
              </div>
            ))}
          </section>
        )}

        {/* Related links */}
        {post.relatedLinks?.length > 0 && (
          <section style={{ marginBottom: 64 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: T.dim, textTransform: 'uppercase', marginBottom: 16 }}>Related</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {post.relatedLinks.map((link, i) => (
                <span key={i} onClick={() => navigate(link.href)}
                  style={{ padding: '8px 16px', fontSize: 12, background: 'rgba(255,255,255,0.04)', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
                  onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border }}
                >{link.label} →</span>
              ))}
            </div>
          </section>
        )}
      </article>

      {/* More posts */}
      {related.length > 0 && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px 80px', borderTop: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: T.dim, textTransform: 'uppercase', margin: '40px 0 24px' }}>More from the blog</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {related.map(p => (
              <div key={p.slug} onClick={() => navigate(`/blog/${p.slug}`)}
                style={{ padding: '24px', border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
                <div style={{ fontSize: 10, letterSpacing: '0.12em', color: T.dim, textTransform: 'uppercase', marginBottom: 10 }}>{p.category}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text, lineHeight: 1.4, marginBottom: 10 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: T.dim }}>{p.readTime}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <MarketingCTA navigate={navigate}
        heading="Try Lumina Design free"
        sub="14-day Pro trial · No credit card · Runs in your browser"
      />
    </MarketingLayout>
  )
}
