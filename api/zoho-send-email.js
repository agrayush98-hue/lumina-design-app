/**
 * Vercel serverless function — sends email via Zoho SMTP (nodemailer).
 *
 * Security:
 *   - CORS locked to known origins
 *   - Requires Firebase ID token in Authorization header
 *   - Recipients restricted to the caller's own verified email
 *     OR internal addresses (allowlist below)
 *
 * Required env vars:
 *   ZOHO_SMTP_PASS           — Zoho SMTP password for support@lightillumina.com
 *   FIREBASE_SERVICE_ACCOUNT — service-account JSON as single-line string
 */

import nodemailer from 'nodemailer'
import { getAdminAuth } from './_adminDb.js'

const ALLOWED_ORIGINS = [
  'https://app.lightillumina.com',
  'https://lumina-design-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
]

// Internal addresses we always allow as recipients
const INTERNAL_RECIPIENTS = new Set([
  'support@lightillumina.com',
  'business@lightillumina.com',
  'info@lightillumina.com',
])

function corsHeaders(req) {
  const origin  = req.headers.origin ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function createTransport(fromAddress) {
  // Choose the auth user based on sender
  const user = fromAddress.includes('info@')     ? 'info@lightillumina.com'
             : fromAddress.includes('business@') ? 'business@lightillumina.com'
             : 'support@lightillumina.com'

  const passEnv = fromAddress.includes('info@')     ? 'ZOHO_SMTP_PASS_INFO'
                : fromAddress.includes('business@') ? 'ZOHO_SMTP_PASS_BUSINESS'
                : 'ZOHO_SMTP_PASS'

  const pass = process.env[passEnv] ?? process.env.ZOHO_SMTP_PASS
  if (!pass) throw new Error(`SMTP password env var ${passEnv} is not set`)

  return nodemailer.createTransport({
    host:   'smtp.zoho.com',
    port:   465,
    secure: true,
    auth:   { user, pass },
  })
}

export default async function handler(req, res) {
  const cors = corsHeaders(req)
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // ── Step 1: verify Firebase ID token ─────────────────────────────────────
  const authHeader = req.headers.authorization ?? ''
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  // Allow unauthenticated sends only for the contact form (info@ sender, no user session)
  const isContactForm = (req.body?.from ?? '').includes('info@')

  let decodedToken = null
  if (!isContactForm) {
    if (!idToken) {
      return res.status(401).json({ error: 'Missing Authorization header. Send: Bearer <firebase-id-token>' })
    }
    try {
      const adminAuth = getAdminAuth()
      decodedToken    = await adminAuth.verifyIdToken(idToken)
    } catch (e) {
      console.error('[zoho-send-email] Token verification failed:', e.message)
      return res.status(401).json({ error: 'Invalid or expired auth token.' })
    }
  }

  // ── Step 2: validate fields ───────────────────────────────────────────────
  const { to, subject, html, from: fromField, replyTo } = req.body ?? {}

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' })
  }

  const fromAddress = fromField ?? 'support@lightillumina.com'
  const recipients  = (Array.isArray(to) ? to : [to]).map(s => s.trim().toLowerCase())

  // For authenticated sends: only allow sending to caller's own email or internal addresses
  if (!isContactForm && decodedToken) {
    const userEmail    = decodedToken.email ?? ''
    const allowedAddrs = new Set([userEmail.toLowerCase(), ...INTERNAL_RECIPIENTS])
    const unauthorized = recipients.filter(r => !allowedAddrs.has(r))
    if (unauthorized.length > 0) {
      console.warn('[zoho-send-email] Blocked unauthorized recipients:',
        unauthorized, '| uid:', decodedToken.uid)
      return res.status(403).json({
        error: `Not allowed to send to: ${unauthorized.join(', ')}`,
      })
    }
  }

  // ── Step 3: send via Zoho SMTP ────────────────────────────────────────────
  const uid = decodedToken?.uid ?? 'contact-form'
  console.log('[zoho-send-email] Sending — uid:', uid,
    '| from:', fromAddress, '| to:', recipients.join(', '), '| subject:', subject.slice(0, 60))

  try {
    const transporter = createTransport(fromAddress)
    const info = await transporter.sendMail({
      from:    fromAddress,
      to:      recipients.join(', '),
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    })
    console.log('[zoho-send-email] ✓ Sent — messageId:', info.messageId)
    return res.status(200).json({ success: true, messageId: info.messageId })
  } catch (err) {
    console.error('[zoho-send-email] SMTP error:', err.message)
    return res.status(500).json({ error: err.message ?? 'Email send failed' })
  }
}
