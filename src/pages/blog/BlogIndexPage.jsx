import { useNavigate } from 'react-router-dom'
import MarketingLayout, { T, FONT, MarketingCTA } from '../MarketingLayout.jsx'
import useSEO from '../../hooks/useSEO.js'
import { BLOG_LIST } from './blogData.js'

const CATEGORIES = ['All', ...new Set(BLOG_LIST.map(p => p.category))]

export default function BlogIndexPage() {
  const navigate = useNavigate()

  useSEO({
    title:       'Blog — Lighting Design Guides, Standards & DALI | Lumina Design',
    description: 'Practical articles on lighting design: lux calculations, EN 12464-1 standards, DALI 2.0 planning, and energy-efficient design for offices, hospitals, and warehouses.',
    canonical:   'https://app.lightillumina.com/blog',
  })

  const blogListSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Lumina Design Blog',
    description: 'Lighting design guides, standards references, and DALI planning resources.',
    url: 'https://app.lightillumina.com/blog',
    blogPost: BLOG_LIST.map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.seoDesc,
      url: p.canonical,
      datePublished: p.date,
    })),
  }

  return (
    <MarketingLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }} />

      {/* Hero */}
      <header style={{ maxWidth: 800, margin: '0 auto', padding: '72px 32px 64px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: T.dim, textTransform: 'uppercase', marginBottom: 18 }}>Resources</div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.15 }}>Lighting design guides</h1>
        <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.75, maxWidth: 540, margin: '0 auto' }}>
          Practical articles on lux calculations, EN 12464-1 standards, DALI 2.0 planning, and fixture selection — written for working lighting designers.
        </p>
      </header>

      {/* Post grid */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
          {BLOG_LIST.map(post => (
            <article key={post.slug}
              onClick={() => navigate(`/blog/${post.slug}`)}
              style={{ border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', overflow: 'hidden', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              {/* Category bar */}
              <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: T.dim, textTransform: 'uppercase' }}>{post.category}</span>
                <span style={{ fontSize: 11, color: T.dim }}>{post.readTime}</span>
              </div>
              {/* Content */}
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, lineHeight: 1.4, marginBottom: 12 }}>{post.title}</h2>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 20 }}>{post.excerpt}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.dim }}>{new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <span style={{ fontSize: 12, color: T.muted, letterSpacing: '0.04em' }}>Read →</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <MarketingCTA navigate={navigate}
        heading="Try Lumina Design — free forever plan"
        sub="3 projects · No credit card · 14-day Pro trial available"
      />
    </MarketingLayout>
  )
}
