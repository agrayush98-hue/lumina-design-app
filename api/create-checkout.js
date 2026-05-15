// Vercel serverless function — creates a Razorpay order
// Required env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

const PLAN_AMOUNTS = {
  pro:          99900,  // ₹999 in paise
  professional: 149900, // ₹1,499 in paise
}

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
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export default async function handler(req, res) {
  const cors = corsHeaders(req)
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, plan } = req.body ?? {}

  if (!userId || !plan) {
    return res.status(400).json({ error: 'Missing required fields: userId, plan' })
  }

  const amount = PLAN_AMOUNTS[plan]
  if (!amount) {
    return res.status(400).json({ error: `Unknown plan "${plan}". Valid plans: pro, professional` })
  }

  const keyId     = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Razorpay credentials not configured on server' })
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization:  `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt:  `rcpt_${userId.slice(0, 12)}_${Date.now()}`,
        notes:    { userId, plan },
      }),
    })

    const order = await rzpRes.json()

    if (!rzpRes.ok) {
      const msg = order?.error?.description ?? order?.error?.code ?? 'Razorpay order creation failed'
      return res.status(502).json({ error: msg })
    }

    return res.status(200).json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId,
    })
  } catch (err) {
    console.error('[create-checkout]', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}
