// Vercel serverless function — sends email via Resend API
// Required env var: RESEND_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const { to, subject, html } = req.body ?? {}

  console.log('[send-email] incoming request — to:', to, 'subject:', subject?.slice(0, 60))

  if (!to || !subject || !html) {
    console.error('[send-email] Missing fields — to:', !!to, 'subject:', !!subject, 'html:', !!html)
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[send-email] RESEND_API_KEY is not set — add it in Vercel > Settings > Environment Variables')
    return res.status(500).json({ error: 'RESEND_API_KEY not configured on server' })
  }

  // Mask key for logging: show prefix only
  console.log('[send-email] using API key prefix:', apiKey.slice(0, 8) + '…')

  const payload = {
    from:    'Lumina Design <noreply@lightillumina.com>',
    to:      Array.isArray(to) ? to : [to],
    subject,
    html,
  }

  console.log('[send-email] calling Resend — from:', payload.from, 'to:', payload.to)

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    const data = await r.json()

    console.log('[send-email] Resend HTTP status:', r.status)
    console.log('[send-email] Resend response body:', JSON.stringify(data))

    if (!r.ok) {
      console.error('[send-email] Resend rejected the request:', data)
      return res.status(r.status).json({
        error:    data.message ?? data.name ?? 'Email send failed',
        resend:   data,
      })
    }

    console.log('[send-email] email sent successfully — id:', data.id)
    return res.status(200).json({ success: true, id: data.id })
  } catch (err) {
    console.error('[send-email] fetch threw:', err.message)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}
