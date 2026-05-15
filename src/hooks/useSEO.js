/**
 * useSEO — sets document title, meta description, canonical, and OG/Twitter tags.
 * Call once per page inside useEffect (or pass directly — hook handles it).
 *
 * Usage:
 *   useSEO({
 *     title:       'Pricing — Lumina Design',
 *     description: '...',
 *     canonical:   'https://app.lightillumina.com/pricing',
 *     ogImage:     'https://app.lightillumina.com/og-image.png',  // optional
 *     ogType:      'website',                                      // optional
 *   })
 */
import { useEffect } from 'react'

const BASE_URL  = 'https://app.lightillumina.com'
const OG_IMAGE  = `${BASE_URL}/og-image.png`
const SITE_NAME = 'Lumina Design'

function setMeta(name, content, attr = 'name') {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  if (!href) return
  let el = document.querySelector("link[rel='canonical']")
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

export default function useSEO({
  title,
  description,
  canonical,
  ogImage  = OG_IMAGE,
  ogType   = 'website',
  noIndex  = false,
} = {}) {
  useEffect(() => {
    if (title)       document.title = title
    if (canonical)   setCanonical(canonical)

    // Meta description
    setMeta('description', description)

    // Robots
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow')

    // Open Graph
    setMeta('og:title',       title,     'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url',         canonical || BASE_URL, 'property')
    setMeta('og:type',        ogType,    'property')
    setMeta('og:image',       ogImage,   'property')
    setMeta('og:site_name',   SITE_NAME, 'property')

    // Twitter Card
    setMeta('twitter:card',        'summary_large_image')
    setMeta('twitter:title',       title)
    setMeta('twitter:description', description)
    setMeta('twitter:image',       ogImage)
  }, [title, description, canonical, ogImage, ogType, noIndex])
}
