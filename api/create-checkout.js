// Vercel serverless function — creates a Razorpay order
// Required env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

const PLAN_AMOUNTS = {
  pro:          117900, // ₹1,179 in paise
  professional: 294900, // ₹2,949 in paise
}

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

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
