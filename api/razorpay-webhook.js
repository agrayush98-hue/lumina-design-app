/**
 * Vercel serverless function — Razorpay webhook handler.
 *
 * Why this exists:
 *   When a user completes payment inside the Razorpay modal, the client calls
 *   /api/verify-payment to activate the subscription. If the user closes the
 *   browser tab before that call completes (network drop, page crash, etc.),
 *   Razorpay still captured the payment but Firestore was never updated.
 *   This webhook catches those cases: Razorpay sends a server-to-server POST
 *   for every captured payment regardless of what the browser does.
 *
 * Setup (Razorpay Dashboard → Settings → Webhooks):
 *   URL:    https://<your-domain>/api/razorpay-webhook
 *   Events: payment.captured
 *   Secret: set RAZORPAY_WEBHOOK_SECRET env var to the same value
 *
 * Required env vars:
 *   RAZORPAY_WEBHOOK_SECRET  — webhook secret from Razorpay Dashboard
 *   FIREBASE_SERVICE_ACCOUNT — service-account JSON as single-line string
 */

import crypto from 'crypto'
import { getAdminDb } from './_adminDb.js'

// Razorpay sends the raw body — Vercel parses it by default.
// We need the raw body string to verify the HMAC signature.
export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// ── Plan detection from order notes / metadata ────────────────────────────────
// Razorpay order notes are set in api/create-checkout.js when the order is
// created. We store planId there so we can read it back here.
function extractPlanId(payload) {
  // create-checkout.js sets notes: { userId, plan }
  const notes = payload?.payload?.payment?.entity?.notes ?? {}
  if (notes.plan)   return notes.plan    // primary (set by create-checkout.js)
  if (notes.planId) return notes.planId  // legacy fallback

  // Last resort: infer from amount
  const amount = payload?.payload?.payment?.entity?.amount ?? 0
  if (amount >= 294900) return 'professional'
  if (amount >= 117900) return 'pro'
  return null
}

function extractUserId(payload) {
  const notes = payload?.payload?.payment?.entity?.notes ?? {}
  return notes.userId ?? null
}

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ── Step 1: read raw body for HMAC verification ───────────────────────────
  let rawBody
  try {
    rawBody = await getRawBody(req)
  } catch (e) {
    console.error('[razorpay-webhook] Failed to read body:', e.message)
    return res.status(400).json({ error: 'Cannot read request body' })
  }

  // ── Step 2: verify Razorpay webhook signature ─────────────────────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not set — rejecting all webhooks')
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }

  const receivedSig = req.headers['x-razorpay-signature'] ?? ''
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  if (receivedSig !== expectedSig) {
    console.warn('[razorpay-webhook] Signature mismatch — possible forged request')
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  // ── Step 3: parse payload ─────────────────────────────────────────────────
  let payload
  try {
    payload = JSON.parse(rawBody.toString())
  } catch (e) {
    console.error('[razorpay-webhook] JSON parse error:', e.message)
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const event = payload?.event
  console.log('[razorpay-webhook] Event received:', event)

  // We only care about payment.captured
  if (event !== 'payment.captured') {
    // Acknowledge other events so Razorpay stops retrying them
    return res.status(200).json({ received: true, skipped: true })
  }

  // ── Step 4: extract userId + planId from order notes ─────────────────────
  const userId = extractUserId(payload)
  const planId = extractPlanId(payload)
  const paymentId = payload?.payload?.payment?.entity?.id ?? null
  const orderId   = payload?.payload?.payment?.entity?.order_id ?? null

  console.log('[razorpay-webhook] payment.captured — userId:', userId,
    '| planId:', planId, '| paymentId:', paymentId, '| orderId:', orderId)

  if (!userId || !planId) {
    // Can't activate without user/plan — log and return 200 (no point retrying)
    console.error('[razorpay-webhook] Missing userId or planId in payment notes.',
      'payment notes:', JSON.stringify(payload?.payload?.payment?.entity?.notes))
    return res.status(200).json({
      received: true,
      warning:  'Could not activate subscription: missing userId or planId in payment notes.',
    })
  }

  // ── Step 5: check if subscription already active (idempotency) ────────────
  let db
  try {
    db = getAdminDb()
  } catch (e) {
    console.error('[razorpay-webhook] Admin SDK init failed:', e.message)
    return res.status(500).json({ error: 'Server configuration error' })
  }

  let userSnap
  try {
    userSnap = await db.doc(`users/${userId}`).get()
  } catch (e) {
    console.error('[razorpay-webhook] Firestore read failed:', e.message)
    return res.status(500).json({ error: 'Firestore read failed' })
  }

  const existing = userSnap.data()?.subscription ?? null

  // If already active with the same paymentId, we already processed this — ack and skip
  if (existing?.status === 'active' && existing?.razorpayPaymentId === paymentId) {
    console.log('[razorpay-webhook] Duplicate webhook — already activated, skipping')
    return res.status(200).json({ received: true, alreadyActivated: true })
  }

  // ── Step 6: write subscription ────────────────────────────────────────────
  try {
    const now      = new Date()
    const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    await db.doc(`users/${userId}`).set({
      subscription: {
        status:            'active',
        plan:              planId,
        activatedAt:       now,
        renewsAt,
        razorpayPaymentId: paymentId,
        razorpayOrderId:   orderId,
        activatedByWebhook: true,
      },
    }, { merge: true })

    console.log('[razorpay-webhook] ✓ Subscription activated for userId:', userId,
      '| plan:', planId)

    return res.status(200).json({ received: true, activated: true })
  } catch (e) {
    console.error('[razorpay-webhook] Firestore write failed:', e.message)
    // Return 500 so Razorpay retries the webhook
    return res.status(500).json({ error: 'Failed to write subscription' })
  }
}
