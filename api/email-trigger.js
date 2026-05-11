/**
 * api/email-trigger.js
 * Thin serverless endpoint that receives { event, payload } from the client
 * and calls email-workflows.trigger() server-side.
 *
 * Security:
 *   - Requires Firebase ID token in Authorization header
 *   - Payload email must match the authenticated user's email (prevents spoofing)
 *   - Only client-safe events are accepted (server-only events like payment_success
 *     are triggered directly from verify-payment.js, not via this endpoint)
 *
 * Required env vars:
 *   RESEND_API_KEY           — Resend API key
 *   FIREBASE_SERVICE_ACCOUNT — service-account JSON as single-line string
 */

import { getAdminAuth } from './_adminDb.js'
import { trigger }      from './email-workflows.js'

const ALLOWED_ORIGINS = [
  'https://app.lightillumina.com',
  'https://lumina-design-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
]

// Events the client is allowed to trigger for its own account
const CLIENT_EVENTS = new Set([
  'trial_started',
  'subscription_expiring',
  'subscription_expired',
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

export default async function handler(req, res) {
  const cors = corsHeaders(req)
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // ── Auth ───────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization ?? ''
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' })

  let decoded
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken)
  } catch {
    return res.status(401).json({ error: 'Invalid or expired auth token' })
  }

  // ── Validate event + payload ───────────────────────────────────────────────
  const { event, payload = {} } = req.body ?? {}

  if (!CLIENT_EVENTS.has(event)) {
    return res.status(400).json({ error: `Event '${event}' is not allowed via this endpoint` })
  }

  // Ensure the email in the payload matches the authenticated user
  const payloadEmail = (payload.email ?? '').toLowerCase()
  const tokenEmail   = (decoded.email ?? '').toLowerCase()
  if (payloadEmail && payloadEmail !== tokenEmail) {
    console.warn('[email-trigger] Email mismatch — uid:', decoded.uid,
      '| token:', tokenEmail, '| payload:', payloadEmail)
    return res.status(403).json({ error: 'Payload email does not match authenticated user' })
  }

  // Always use the verified token email (never trust payload.email blindly)
  const safePayload = { ...payload, email: decoded.email }

  // ── Trigger ────────────────────────────────────────────────────────────────
  const result = await trigger(event, safePayload)
  if (!result.ok) {
    console.error('[email-trigger] trigger failed:', result.error)
    return res.status(500).json({ error: result.error })
  }

  return res.status(200).json({ success: true, id: result.id })
}
