// Vercel serverless test endpoint — sends a test email and returns the full Resend response.
// Hit via GET: https://app.lightillumina.com/api/test-email
// Remove or gate this endpoint before going to production.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.RESEND_API_KEY

  // ── Env check ──────────────────────────────────────────────────────────────
  const envStatus = {
    RESEND_API_KEY: apiKey
      ? `SET (prefix: ${apiKey.slice(0, 8)}…, length: ${apiKey.length})`
      : 'NOT SET — add it in Vercel > Settings > Environment Variables',
  }
  console.log('[test-email] env check:', envStatus)

  if (!apiKey) {
    return res.status(500).json({
      error:  'RESEND_API_KEY not configured',
      env:    envStatus,
      action: 'Go to vercel.com → your project → Settings → Environment Variables → add RESEND_API_KEY',
    })
  }

  // ── Send test email ────────────────────────────────────────────────────────
  const to      = req.query.to ?? 'agrayush98@gmail.com'
  const payload = {
    from:    'Lumina Design <noreply@lightillumina.com>',
    to:      [to],
    subject: 'Lumina Design — email system test',
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px;background:#000;font-family:monospace;color:#fff;">
  <p style="color:#d4a843;font-size:14px;letter-spacing:0.1em;">LUMINA DESIGN — EMAIL TEST</p>
  <p style="color:#888;font-size:12px;">This test email was sent at: <strong style="color:#fff;">${new Date().toISOString()}</strong></p>
  <p style="color:#888;font-size:12px;">From: <strong style="color:#fff;">noreply@lightillumina.com</strong></p>
  <p style="color:#888;font-size:12px;">To: <strong style="color:#fff;">${to}</strong></p>
  <p style="color:#555;font-size:11px;">If you received this, the Resend integration is working correctly.</p>
</body>
</html>`,
  }

  console.log('[test-email] sending to:', to)

  try {
    const r    = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data = await r.json()

    console.log('[test-email] Resend status:', r.status, '— body:', JSON.stringify(data))

    return res.status(200).json({
      resendStatus:  r.status,
      resendOk:      r.ok,
      resendResponse: data,
      env:           envStatus,
      sentTo:        to,
      sentAt:        new Date().toISOString(),
      ...(r.ok
        ? { result: 'EMAIL SENT — check inbox (and spam folder)' }
        : { result: 'RESEND REJECTED — see resendResponse for reason' }),
    })
  } catch (err) {
    console.error('[test-email] fetch error:', err)
    return res.status(500).json({
      error: err.message,
      env:   envStatus,
    })
  }
}
