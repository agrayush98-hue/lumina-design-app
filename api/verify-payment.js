// Vercel serverless function — verifies Razorpay payment HMAC signature then
// writes subscription to Firestore via Firebase Admin SDK (bypasses client rules).
//
// ✅ Sole authoritative writer of subscription status on successful payment.
//    Client-side createSubscription() in src/firebase.js is deprecated (throws).
//    Firestore security rules (VULN-001) block any client writes to subscription fields.
//    api/razorpay-webhook.js handles the edge case where the browser closes before
//    this function is called (Razorpay retries the webhook until we return 200).
//
// Required env vars:
//   RAZORPAY_KEY_SECRET       — Razorpay secret key
//   FIREBASE_SERVICE_ACCOUNT  — service-account JSON as single-line string

import crypto from 'crypto'
import { getAdminDb, getAdminAuth } from './_adminDb.js'
import { trigger }    from './email-workflows.js'

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

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const cors = corsHeaders(req)
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // ── Step 0: Verify Firebase ID token — prevents userId spoofing ──────────────
  const authHeader = req.headers.authorization ?? ''
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!idToken) {
    return res.status(401).json({ error: 'Missing Authorization header' })
  }

  let decodedToken
  try {
    decodedToken = await getAdminAuth().verifyIdToken(idToken)
  } catch (err) {
    console.warn('[verify-payment] Invalid ID token:', err.message)
    return res.status(401).json({ error: 'Invalid or expired Firebase token' })
  }

  const verifiedUserId = decodedToken.uid

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId,
  } = req.body ?? {}

  console.log('[verify-payment] Request — userId:', verifiedUserId, '| planId:', planId,
    '| order_id:', razorpay_order_id, '| payment_id:', razorpay_payment_id)

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // ── Step 1: HMAC verification ─────────────────────────────────────────────
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  console.log('[verify-payment] RAZORPAY_KEY_SECRET present:', !!keySecret)

  if (!keySecret) {
    return res.status(500).json({ error: 'RAZORPAY_KEY_SECRET not configured on server' })
  }

  const expectedSig = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  const sigMatch = expectedSig === razorpay_signature
  console.log('[verify-payment] Signature match:', sigMatch)

  if (!sigMatch) {
    console.warn('[verify-payment] Signature MISMATCH — userId:', userId)
    return res.status(400).json({ error: 'Payment signature verification failed' })
  }

  console.log('[verify-payment] ✓ Signature OK — proceeding to Firestore write')

  // ── Step 2: Firestore server-side write ────────────────────────────────────
  let db
  try {
    db = getAdminDb()
  } catch (err) {
    console.error('[verify-payment] Cannot get Firestore client:', err.message)
    // 500 — do NOT return success:true. Returning success here would trigger the
    // client-side createSubscription() fallback which bypasses HMAC verification.
    // The user's payment succeeded with Razorpay; they should contact support.
    return res.status(500).json({
      success: false,
      error:   'Server configuration error. Your payment was received but could not be activated automatically. Please contact support with your payment ID.',
      paymentId: razorpay_payment_id,
    })
  }

  try {
    const now      = new Date()
    const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const payload = {
      subscription: {
        status:            'active',
        plan:              planId,
        activatedAt:       now,
        renewsAt,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId:   razorpay_order_id,
      },
    }

    console.log('[verify-payment] Writing to users/' + verifiedUserId, JSON.stringify(payload.subscription))

    await db.doc(`users/${verifiedUserId}`).set(payload, { merge: true })

    console.log('[verify-payment] ✓ Firestore write complete for userId:', verifiedUserId)

    // Fire payment_success email — fetch user email from Firestore, never block the response
    db.doc(`users/${verifiedUserId}`).get().then(snap => {
      const { email, name } = snap.data() ?? {}
      if (email) {
        trigger('payment_success', {
          email,
          name,
          planId,
          paymentId: razorpay_payment_id,
          renewsAt,
        }).catch(() => {})
      }
    }).catch(() => {})

    return res.status(200).json({
      success:          true,
      paymentId:        razorpay_payment_id,
      planId,
      firestoreWritten: true,
    })
  } catch (err) {
    console.error('[verify-payment] Firestore write FAILED:', err.message, err.code ?? '')
    // 500 — do NOT return success:true. Same reason as the Admin SDK catch above:
    // a success response triggers the client-side createSubscription() fallback.
    return res.status(500).json({
      success: false,
      error:   'Payment was verified but subscription activation failed. Please contact support with your payment ID.',
      paymentId: razorpay_payment_id,
    })
  }
}
