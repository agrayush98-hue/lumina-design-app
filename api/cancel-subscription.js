/**
 * Vercel serverless function — cancels a user's subscription server-side.
 *
 * Why server-side? The Firestore security rule blocks clients from writing
 * the `subscription` field (VULN-001 fix). Cancellation must go through the
 * Firebase Admin SDK which bypasses client rules.
 *
 * Auth: caller must send their Firebase ID token in the Authorization header.
 *   Authorization: Bearer <firebase-id-token>
 *
 * Required env vars:
 *   FIREBASE_SERVICE_ACCOUNT — service-account JSON as single-line string
 */

import { getAdminDb, getAdminAuth } from './_adminDb.js'

const ALLOWED_ORIGINS = [
  'https://app.lightillumina.com',
  'https://lumina-design-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
]

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
    console.error('[cancel-subscription] Token verification failed:', e.message)
    return res.status(401).json({ error: 'Invalid or expired auth token. Please sign in again.' })
  }

  const verifiedUserId = decodedToken.uid
  const { userId }     = req.body ?? {}

  // Ensure the token belongs to the user making the request (no impersonation)
  if (!userId || userId !== verifiedUserId) {
    return res.status(403).json({ error: 'Forbidden: userId does not match auth token.' })
  }

  // ── Step 2: read current subscription ────────────────────────────────────
  let db
  try {
    db = getAdminDb()
  } catch (e) {
    console.error('[cancel-subscription] Admin SDK init failed:', e.message)
    return res.status(500).json({ error: 'Server configuration error. Please contact support.' })
  }

  let userSnap
  try {
    userSnap = await db.doc(`users/${userId}`).get()
  } catch (e) {
    console.error('[cancel-subscription] Firestore read failed:', e.message)
    return res.status(500).json({ error: 'Failed to read subscription data.' })
  }

  if (!userSnap.exists) {
    return res.status(404).json({ error: 'User document not found.' })
  }

  const sub = userSnap.data()?.subscription ?? null

  if (!sub || sub.status !== 'active') {
    return res.status(400).json({ error: 'No active subscription found to cancel.' })
  }

  // ── Step 3: write cancellation server-side ────────────────────────────────
  try {
    const now = new Date()

    // Preserve renewsAt so the client can show "access until <date>"
    await db.doc(`users/${userId}`).set(
      {
        subscription: {
          ...sub,
          status:      'cancelled',
          cancelledAt: now,
          // renewsAt is kept intact — it marks when access actually ends
        },
      },
      { merge: true },
    )

    console.log('[cancel-subscription] ✓ Cancelled subscription for userId:', userId)

    return res.status(200).json({
      success:     true,
      cancelledAt: now.toISOString(),
      accessUntil: sub.renewsAt
        ? (sub.renewsAt.toDate?.() ?? sub.renewsAt).toISOString()
        : null,
    })
  } catch (e) {
    console.error('[cancel-subscription] Firestore write failed:', e.message)
    return res.status(500).json({ error: 'Failed to cancel subscription. Please contact support.' })
  }
}
