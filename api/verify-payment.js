// Vercel serverless function — verifies Razorpay payment signature then
// writes subscription to Firestore server-side (guaranteed activation).
//
// Required env vars:
//   RAZORPAY_KEY_SECRET       — Razorpay secret key
//   FIREBASE_SERVICE_ACCOUNT  — full service-account JSON as a single-line string

import crypto from 'crypto'

// ── Firebase Admin — lazy singleton ───────────────────────────────────────────
// Initialised once per cold start; re-used across warm invocations.
let _adminDb = null
let _initError = null

function getAdminDb() {
  if (_adminDb)    return _adminDb
  if (_initError)  throw _initError

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  console.log('[verify-payment] FIREBASE_SERVICE_ACCOUNT present:', !!raw,
    raw ? `(length ${raw.length})` : '— NOT SET')

  if (!raw) {
    _initError = new Error('FIREBASE_SERVICE_ACCOUNT env var is not set in Vercel')
    throw _initError
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(raw)
    console.log('[verify-payment] Service account parsed — project_id:', serviceAccount.project_id,
      '| client_email:', serviceAccount.client_email)
  } catch (e) {
    _initError = new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${e.message}`)
    throw _initError
  }

  try {
    // Dynamic import avoids bundling firebase-admin into the client build
    const { initializeApp, getApps, cert } = require('firebase-admin/app')
    const { getFirestore }                  = require('firebase-admin/firestore')

    if (!getApps().length) {
      console.log('[verify-payment] Initialising Firebase Admin app…')
      initializeApp({ credential: cert(serviceAccount) })
      console.log('[verify-payment] Firebase Admin app initialised OK')
    } else {
      console.log('[verify-payment] Firebase Admin app already initialised')
    }

    _adminDb = getFirestore()
    console.log('[verify-payment] Firestore Admin client obtained OK')
    return _adminDb
  } catch (e) {
    _initError = new Error(`Firebase Admin init failed: ${e.message}`)
    console.error('[verify-payment]', _initError.message)
    throw _initError
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    planId,
  } = req.body ?? {}

  console.log('[verify-payment] Request — userId:', userId, '| planId:', planId,
    '| order_id:', razorpay_order_id, '| payment_id:', razorpay_payment_id)

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId) {
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
    // Return success=true so client fallback write runs
    return res.status(200).json({
      success:          true,
      paymentId:        razorpay_payment_id,
      planId,
      firestoreWritten: false,
      adminError:       err.message,
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

    console.log('[verify-payment] Writing to users/' + userId, JSON.stringify(payload.subscription))

    await db.doc(`users/${userId}`).set(payload, { merge: true })

    console.log('[verify-payment] ✓ Firestore write complete for userId:', userId)

    return res.status(200).json({
      success:          true,
      paymentId:        razorpay_payment_id,
      planId,
      firestoreWritten: true,
    })
  } catch (err) {
    console.error('[verify-payment] Firestore write FAILED:', err.message, err.code ?? '')
    return res.status(200).json({
      success:          true,
      paymentId:        razorpay_payment_id,
      planId,
      firestoreWritten: false,
      firestoreError:   err.message,
    })
  }
}
