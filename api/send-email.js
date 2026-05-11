/**
 * Vercel serverless function — sends email via Resend API.
 *
 * Security:
 *   - CORS locked to known origins
 *   - Requires Firebase ID token for user-initiated emails
 *   - Contact form path (isContactForm) skips auth — sends to support@ only
 *   - Authenticated path restricts recipients to caller's own email or internal addresses
 *
 * Required env vars:
 *   RESEND_API_KEY           — Resend API key
 *   FIREBASE_SERVICE_ACCOUNT — service-account JSON as single-line string
 */

import { getAdminAuth } from './_adminDb.js'

const ALLOWED_ORIGINS = [
  'https://app.lightillumina.com',
  'https://lumina-design-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
]

const INTERNAL_RECIPIENTS = new Set([
  'support@lightillumina.com',
  'business@lightillumina.com',
  'info@lightillumina.com',
])

// Contact form always lands here; reply-to is set to submitter's address
const CONTACT_FORM_RECIPIENT = 'support@lightillumina.com'
const CONTACT_FORM_FROM      = 'Lumina Contact Form <onboarding@resend.dev>'

// Default from for authenticated (user) emails
const USER_EMAIL_FROM = 'Lumina Design <onboarding@resend.dev>'

function corsHeaders(req) {
  const origin  = req.headers.origin ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export default async function handler(req, res) {
  const cors = corsHeaders(req)
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const { to, subject, html, replyTo, isContactForm } = req.body ?? {}

  if (!subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: subject, html' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[send-email] RESEND_API_KEY is not set')
    return res.status(500).json({ error: 'Email service not configured' })
  }

  // ── Contact form path — no auth required ─────────────────────────────────
  if (isContactForm) {
    console.log('[send-email] contact-form send | subject:', subject.slice(0, 80))
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:     CONTACT_FORM_FROM,
          to:       [CONTACT_FORM_RECIPIENT],
          subject,
          html,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        console.error('[send-email] Resend rejected contact form:', data)
        return res.status(r.status).json({ error: data.message ?? 'Email send failed' })
      }
      console.log('[send-email] ✓ contact form sent — id:', data.id)
      return res.status(200).json({ success: true, id: data.id })
    } catch (err) {
      console.error('[send-email] contact form fetch threw:', err.message)
      return res.status(500).json({ error: 'Failed to send message. Please try again.' })
    }
  }

  // ── Authenticated path — requires Firebase ID token ───────────────────────
  const authHeader = req.headers.authorization ?? ''
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!idToken) {
    return res.status(401).json({ error: 'Missing Authorization header. Send: Bearer <firebase-id-token>' })
  }

  let decodedToken
  try {
    const adminAuth = getAdminAuth()
    decodedToken    = await adminAuth.verifyIdToken(idToken)
  } catch (e) {
    console.error('[send-email] Token verification failed:', e.message)
    return res.status(401).json({ error: 'Invalid or expired auth token.' })
  }

  const recipients = (Array.isArray(to) ? to : [to]).map(s => s.trim().toLowerCase())
  const userEmail  = decodedToken.email ?? ''
  const allowed    = new Set([userEmail.toLowerCase(), ...INTERNAL_RECIPIENTS])
  const blocked    = recipients.filter(r => !allowed.has(r))

  if (blocked.length > 0) {
    console.warn('[send-email] Blocked unauthorized recipients:', blocked, '| uid:', decodedToken.uid)
    return res.status(403).json({ error: `Not allowed to send to: ${blocked.join(', ')}` })
  }

  console.log('[send-email] uid:', decodedToken.uid, '| to:', recipients.join(', '), '| subject:', subject.slice(0, 60))

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    USER_EMAIL_FROM,
        to:      recipients,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })
    const data = await r.json()
    if (!r.ok) {
      console.error('[send-email] Resend rejected:', data)
      return res.status(r.status).json({ error: data.message ?? 'Email send failed' })
    }
    console.log('[send-email] ✓ sent — id:', data.id)
    return res.status(200).json({ success: true, id: data.id })
  } catch (err) {
    console.error('[send-email] fetch threw:', err.message)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}
