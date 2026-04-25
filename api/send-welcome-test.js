// Manual trigger — sends the welcome email template to a given address.
// GET: /api/send-welcome-test?to=you@example.com  (defaults to agrayush98@gmail.com)
// Remove or gate this endpoint before going to production.

import { emailWelcome } from '../src/emails/templates.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' })
  }

  const to        = req.query.to ?? 'agrayush98@gmail.com'
  const name      = req.query.name ?? 'Test User'
  const trialEnd  = new Date(); trialEnd.setDate(trialEnd.getDate() + 14)

  const html = emailWelcome({ name, trialEndsAt: trialEnd })

  console.log('[send-welcome-test] sending welcome email to:', to)

  try {
    const r    = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        from:    'Lumina Design <noreply@lightillumina.com>',
        to:      [to],
        subject: 'Welcome to Lumina Design — Your 14-day trial has started',
        html,
      }),
    })
    const data = await r.json()
    console.log('[send-welcome-test] Resend status:', r.status, '— body:', JSON.stringify(data))
    return res.status(200).json({
      resendStatus:   r.status,
      resendOk:       r.ok,
      resendResponse: data,
      sentTo:         to,
      sentAt:         new Date().toISOString(),
      result:         r.ok ? 'WELCOME EMAIL SENT' : 'RESEND REJECTED — see resendResponse',
    })
  } catch (err) {
    console.error('[send-welcome-test] fetch error:', err)
    return res.status(500).json({ error: err.message })
  }
}
