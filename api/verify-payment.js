// Vercel serverless function — verifies Razorpay payment signature
// Required env vars: RAZORPAY_KEY_SECRET

import crypto from 'crypto'

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

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
    return res.status(400).json({
      error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature, userId',
    })
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    return res.status(500).json({ error: 'Razorpay secret not configured on server' })
  }

  // Razorpay signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret)
  const payload     = `${razorpay_order_id}|${razorpay_payment_id}`
  const expectedSig = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex')

  if (expectedSig !== razorpay_signature) {
    console.warn('[verify-payment] Signature mismatch for userId:', userId)
    return res.status(400).json({ error: 'Payment signature verification failed' })
  }

  // Signature valid — subscription activation is handled client-side via Firestore SDK
  return res.status(200).json({
    success:   true,
    paymentId: razorpay_payment_id,
    planId:    planId ?? null,
  })
}
