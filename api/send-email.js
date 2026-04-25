// Vercel serverless function — sends email via Resend API
// Required env var: RESEND_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const { to, subject, html } = req.body ?? {}

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured on server' })
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Lumina Design <noreply@lightillumina.com>',
        to:   Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    })

    const data = await r.json()

    if (!r.ok) {
      console.error('[send-email] Resend error:', data)
      return res.status(r.status).json({ error: data.message ?? 'Email send failed' })
    }

    return res.status(200).json({ success: true, id: data.id })
  } catch (err) {
    console.error('[send-email] Unexpected error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}
