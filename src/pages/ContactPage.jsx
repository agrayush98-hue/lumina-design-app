import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif"

const T = {
  bg:         '#000000',
  text:       '#ffffff',
  muted:      'rgba(255,255,255,0.55)',
  dim:        'rgba(255,255,255,0.30)',
  border:     'rgba(255,255,255,0.10)',
  inputBg:    'rgba(255,255,255,0.04)',
  inputFocus: 'rgba(255,255,255,0.08)',
  btnGray:    'rgba(255,255,255,0.10)',
  btnGrayHov: 'rgba(255,255,255,0.16)',
}

const NAV_LINKS = [
  { label: 'HOME',         path: '/' },
  { label: 'FEATURES',     path: '/features' },
  { label: 'HOW IT WORKS', path: '/features#how' },
  { label: 'PRICING',      path: '/pricing' },
  { label: 'CONTACT',      path: '/contact' },
]

function Nav({ navigate }) {
  function go(path) {
    navigate(path)
  }
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: 60,
      borderBottom: `1px solid ${T.border}`,
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)',
    }}>
      <span onClick={() => navigate('/')} style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.18em', cursor: 'pointer', userSelect: 'none' }}>LUMINA</span>
      <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
        {NAV_LINKS.map(l => (
          <span key={l.label} onClick={() => go(l.path)}
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: l.path === '/contact' ? T.text : T.muted, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = l.path === '/contact' ? T.text : T.muted}
          >{l.label}</span>
        ))}
      </div>
      <button onClick={() => navigate('/app')}
        style={{ padding: '8px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', background: T.btnGray, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
        onMouseEnter={e => e.currentTarget.style.background = T.btnGrayHov}
        onMouseLeave={e => e.currentTarget.style.background = T.btnGray}
      >LAUNCH APP</button>
    </nav>
  )
}

const SUBJECTS = [
  'General enquiry',
  'Sales / pricing',
  'Technical support',
  'Partnership / reseller',
  'Report a bug',
  'Other',
]

export default function ContactPage() {
  const navigate = useNavigate()

  const [form, setForm]       = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })
  const [status, setStatus]   = useState('idle') // idle | sending | success | error
  const [errMsg, setErrMsg]   = useState('')

  useEffect(() => {
    const link = document.querySelector("link[rel='canonical']") || document.createElement('link')
    link.rel  = 'canonical'
    link.href = 'https://lumina-design-rho.vercel.app/contact'
    if (!link.parentNode) document.head.appendChild(link)
    document.title = 'Contact — Lumina Design'
  }, [])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return

    setStatus('sending')
    setErrMsg('')

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="font-size:20px;margin-bottom:24px">New contact form submission</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#888;width:100px;vertical-align:top">Name</td><td style="padding:8px 0">${form.name}</td></tr>
          <tr><td style="padding:8px 0;color:#888;vertical-align:top">Email</td><td style="padding:8px 0"><a href="mailto:${form.email}">${form.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#888;vertical-align:top">Subject</td><td style="padding:8px 0">${form.subject}</td></tr>
          <tr><td style="padding:8px 0;color:#888;vertical-align:top">Message</td><td style="padding:8px 0;white-space:pre-wrap">${form.message.replace(/</g, '&lt;')}</td></tr>
        </table>
      </div>
    `

    try {
      const r = await fetch('/api/send-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to:      'info@lightillumina.com',
          subject: `[Contact] ${form.subject} — ${form.name}`,
          html,
          from:    'Lumina Design Contact <info@lightillumina.com>',
          replyTo: form.email,
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`)
      setStatus('success')
      setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' })
    } catch (err) {
      setStatus('error')
      setErrMsg(err.message ?? 'Something went wrong. Please try again.')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    color: T.text,
    background: T.inputBg,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    fontFamily: FONT,
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: FONT }}>
      <Nav navigate={navigate} />

      {/* Hero */}
      <header style={{ textAlign: 'center', padding: '80px 32px 64px', borderBottom: `1px solid ${T.border}` }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
          Get in touch
        </h1>
        <p style={{ fontSize: 15, color: T.muted, maxWidth: 460, margin: '0 auto', lineHeight: 1.75 }}>
          Questions about pricing, technical support, or partnerships — we reply within one business day.
        </p>
      </header>

      {/* Two columns */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '72px 32px 100px', display: 'flex', gap: 80, flexWrap: 'wrap' }}>

        {/* Left — info */}
        <div style={{ flex: '0 0 260px', minWidth: 220 }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: T.dim, textTransform: 'uppercase', marginBottom: 20 }}>Support</div>
            <a href="mailto:support@lightillumina.com" style={{ color: T.text, fontSize: 14, textDecoration: 'none' }}>support@lightillumina.com</a>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 6, lineHeight: 1.6 }}>Technical issues, billing, account help</div>
          </div>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: T.dim, textTransform: 'uppercase', marginBottom: 20 }}>Business</div>
            <a href="mailto:business@lightillumina.com" style={{ color: T.text, fontSize: 14, textDecoration: 'none' }}>business@lightillumina.com</a>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 6, lineHeight: 1.6 }}>Partnerships, reseller enquiries, enterprise</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: T.dim, textTransform: 'uppercase', marginBottom: 20 }}>Response time</div>
            <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.7 }}>
              Within 1 business day<br />
              Mon–Fri, 9 am–6 pm IST
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div style={{ flex: '1 1 360px', minWidth: 280 }}>
          {status === 'success' ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Message sent</div>
              <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, marginBottom: 32 }}>
                We'll get back to you at <strong>{form.email || 'your email'}</strong> within one business day.
              </div>
              <button
                onClick={() => setStatus('idle')}
                style={{ padding: '10px 24px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', background: T.btnGray, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
                onMouseEnter={e => e.currentTarget.style.background = T.btnGrayHov}
                onMouseLeave={e => e.currentTarget.style.background = T.btnGray}
              >SEND ANOTHER</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Name + Email row */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: T.dim, textTransform: 'uppercase', marginBottom: 8 }}>Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Jane Smith"
                    style={inputStyle}
                    onFocus={e => e.target.style.background = T.inputFocus}
                    onBlur={e => e.target.style.background = T.inputBg}
                  />
                </div>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: T.dim, textTransform: 'uppercase', marginBottom: 8 }}>Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={set('email')}
                    placeholder="jane@firm.com"
                    style={inputStyle}
                    onFocus={e => e.target.style.background = T.inputFocus}
                    onBlur={e => e.target.style.background = T.inputBg}
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: T.dim, textTransform: 'uppercase', marginBottom: 8 }}>Subject</label>
                <select
                  value={form.subject}
                  onChange={set('subject')}
                  style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                  onFocus={e => e.target.style.background = T.inputFocus}
                  onBlur={e => e.target.style.background = T.inputBg}
                >
                  {SUBJECTS.map(s => <option key={s} value={s} style={{ background: '#111' }}>{s}</option>)}
                </select>
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: T.dim, textTransform: 'uppercase', marginBottom: 8 }}>Message</label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Describe your question or project…"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.background = T.inputFocus}
                  onBlur={e => e.target.style.background = T.inputBg}
                />
              </div>

              {status === 'error' && (
                <div style={{ fontSize: 13, color: '#f87171', padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)', borderRadius: 4 }}>
                  {errMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                style={{
                  padding: '13px',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  background: status === 'sending' ? T.btnGray : '#ffffff',
                  color: status === 'sending' ? T.muted : '#000000',
                  border: 'none',
                  borderRadius: 4,
                  cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                  fontFamily: FONT,
                  textTransform: 'uppercase',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (status !== 'sending') e.currentTarget.style.background = 'rgba(255,255,255,0.88)' }}
                onMouseLeave={e => { if (status !== 'sending') e.currentTarget.style.background = '#ffffff' }}
              >
                {status === 'sending' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontSize: 12, color: T.dim }}>© 2026 Lumina Design</div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[['Home', '/'], ['Features', '/features'], ['Pricing', '/pricing'], ['App', '/app']].map(([label, path]) => (
            <span key={label} onClick={() => navigate(path)}
              style={{ fontSize: 11, color: T.dim, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
              onMouseEnter={e => e.currentTarget.style.color = T.muted}
              onMouseLeave={e => e.currentTarget.style.color = T.dim}
            >{label}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
