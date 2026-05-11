/**
 * Vercel serverless function — sends email via Resend API.
 *
 * Security fixes applied:
 *   - CORS locked to known origins only (was '*' — open relay)
 *   - Requires Firebase ID token in Authorization header
 *   - Token UID must match the 'to' address (or be any valid user — see below)
 *   - Only sends to the authenticated user's own email or support@lightillumina.com
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

// Internal address we always allow as a recipient (support replies, etc.)
const INTERNAL_RECIPIENT = 'support@lightillumina.com'
const FROM_ADDRESS = 'Lumina Design <noreply@lightillumina.com>'

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

  // ── Step 1: verify Firebase ID token ──────────────────────────────────────
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

  // ── Step 2: validate and extract fields ───────────────────────────────────
  const { to, subject, html } = req.body ?? {}

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' })
  }

  // Only allow sending to the authenticated user's own verified email,
  // or to our internal support address. This prevents using this endpoint
  // as an open relay to send spam to arbitrary addresses.
  const userEmail    = decodedToken.email ?? ''
  const recipients   = (Array.isArray(to) ? to : [to]).map(s => s.trim().toLowerCase())
  const allowedAddrs = new Set([userEmail.toLowerCase(), INTERNAL_RECIPIENT])

  const unauthorized = recipients.filter(r => !allowedAddrs.has(r))
  if (unauthorized.length > 0) {
    console.warn('[send-email] Blocked attempt to send to unauthorized recipients:',
      unauthorized, '| caller uid:', decodedToken.uid)
    return res.status(403).json({
      error: `Not allowed to send email to: ${unauthorized.join(', ')}. You may only send to your own address.`,
    })
  }

  // ── Step 3: send via Resend ───────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[send-email] RESEND_API_KEY is not set')
    return res.status(500).json({ error: 'Email service not configured on server' })
  }

  console.log('[send-email] Sending — uid:', decodedToken.uid,
    '| to:', recipients.join(', '), '| subject:', subject.slice(0, 60))

  const payload = {
    from:    FROM_ADDRESS,
    to:      recipients,
    subject,
    html,
  }

  try {
    const r    = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data = await r.json()

    if (!r.ok) {
      console.error('[send-email] Resend rejected request:', data)
      return res.status(r.status).json({ error: data.message ?? data.name ?? 'Email send failed' })
    }

    console.log('[send-email] ✓ Sent — id:', data.id)
    return res.status(200).json({ success: true, id: data.id })
  } catch (err) {
    console.error('[send-email] fetch threw:', err.message)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}
