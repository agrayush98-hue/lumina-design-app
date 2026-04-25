// Vercel serverless function — verifies Razorpay payment signature then
// writes subscription to Firestore server-side so activation is guaranteed
// even if the client crashes before its own Firestore call.
//
// Required env vars:
//   RAZORPAY_KEY_SECRET       — Razorpay secret key
//   FIREBASE_SERVICE_ACCOUNT  — Firebase service-account JSON (stringified)

import crypto from 'crypto'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue }     from 'firebase-admin/firestore'

// One initialisation per cold start
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '{}')),
    })
  } catch (e) {
    console.error('[verify-payment] Firebase Admin init failed:', e.message)
  }
}

let adminDb
try { adminDb = getFirestore() } catch { /* handled per-request below */ }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    planId,
  } = req.body ?? {}

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId) {
    return res.status(400).json({
      error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId',
    })
  }

  // ── 1. Verify HMAC signature ───────────────────────────────────────────────
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    return res.status(500).json({ error: 'Razorpay secret not configured on server' })
  }

  const expectedSig = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSig !== razorpay_signature) {
    console.warn('[verify-payment] Signature mismatch — userId:', userId)
    return res.status(400).json({ error: 'Payment signature verification failed' })
  }

  console.log('[verify-payment] Signature OK — userId:', userId, 'planId:', planId)

  // ── 2. Write subscription to Firestore (server-side, guaranteed) ───────────
  if (!adminDb) {
    // Admin SDK not initialised — tell the client so it can fall back
    console.error('[verify-payment] Firestore Admin unavailable — FIREBASE_SERVICE_ACCOUNT may be missing')
    return res.status(200).json({
      success:   true,
      paymentId: razorpay_payment_id,
      planId,
      firestoreWritten: false,
      warning: 'FIREBASE_SERVICE_ACCOUNT not configured — subscription write skipped on server',
    })
  }

  try {
    const now      = new Date()
    const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    await adminDb.doc(`users/${userId}`).set({
      subscription: {
        status:            'active',
        plan:              planId,
        activatedAt:       now,
        renewsAt:          renewsAt,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId:   razorpay_order_id,
      },
    }, { merge: true })

    console.log('[verify-payment] Firestore subscription written for userId:', userId)

    return res.status(200).json({
      success:          true,
      paymentId:        razorpay_payment_id,
      planId,
      firestoreWritten: true,
    })
  } catch (err) {
    // Firestore write failed — still return success so client can try its own write
    console.error('[verify-payment] Firestore write error:', err.message)
    return res.status(200).json({
      success:          true,
      paymentId:        razorpay_payment_id,
      planId,
      firestoreWritten: false,
      warning:          `Server Firestore write failed: ${err.message}`,
    })
  }
}
