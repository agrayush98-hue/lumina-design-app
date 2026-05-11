/**
 * email-workflows.js
 * Centralised email workflow engine.
 * All transactional emails go through sendViaResend() here.
 *
 * Usage (server-side only — runs in Vercel functions):
 *   import { trigger } from './email-workflows.js'
 *   await trigger('payment_success', { email, name, planId, paymentId, amount, renewsAt })
 *
 * Triggers:
 *   contact_form_received  — auto-reply to person who submitted contact form
 *   trial_started          — welcome + trial info on signup
 *   payment_success        — subscription activated confirmation
 *   payment_failed         — payment failed, retry prompt
 *   subscription_expiring  — reminder 3 days before renewal/expiry
 *   subscription_expired   — reactivation prompt after expiry
 */

const APP_URL  = 'https://app.lightillumina.com'
const DASH_URL = `${APP_URL}/dashboard`
const SUB_URL  = `${DASH_URL}?tab=subscription`

// ── From addresses ────────────────────────────────────────────────────────────
const FROM = {
  info:     'Lumina Design <info@lightillumina.com>',
  business: 'Lumina Design <business@lightillumina.com>',
}

// ── Shared layout ─────────────────────────────────────────────────────────────
function wrap(preheader, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Lumina Design</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:'Helvetica Neue',Arial,sans-serif;">
<!-- preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#000000;">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;width:100%;">

      <!-- Header -->
      <tr><td style="padding:0 0 32px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td>
              <span style="font-size:15px;font-weight:700;letter-spacing:0.16em;color:#d4a843;">LUMINA</span>
            </td>
            <td align="right">
              <span style="font-size:11px;color:#444444;letter-spacing:0.06em;">lightillumina.com</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#0d0d0d;border:1px solid #1a1a1a;border-radius:6px;padding:40px 40px 36px;">
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:28px 0 0;text-align:center;">
        <p style="margin:0 0 8px;font-size:11px;color:#333333;letter-spacing:0.04em;">
          © 2026 Lumina Design · <a href="https://lightillumina.com" style="color:#444444;text-decoration:none;">lightillumina.com</a>
        </p>
        <p style="margin:0;font-size:11px;color:#2a2a2a;">
          You're receiving this because you have a Lumina account.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function h1(text) {
  return `<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;line-height:1.3;">${text}</h1>`
}
function p(text, style = '') {
  return `<p style="margin:0 0 18px;font-size:14px;color:#888888;line-height:1.75;${style}">${text}</p>`
}
function goldBtn(label, href) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px;">
    <tr><td style="border-radius:3px;background:#d4a843;">
      <a href="${href}" target="_blank"
         style="display:inline-block;padding:13px 30px;font-size:12px;font-weight:700;
                color:#000000;text-decoration:none;letter-spacing:0.1em;
                text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif;">${label}</a>
    </td></tr>
  </table>`
}
function ghostBtn(label, href) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:12px 0 8px;">
    <tr><td style="border-radius:3px;border:1px solid #2a2a2a;">
      <a href="${href}" target="_blank"
         style="display:inline-block;padding:11px 28px;font-size:12px;font-weight:500;
                color:#666666;text-decoration:none;letter-spacing:0.06em;
                font-family:'Helvetica Neue',Arial,sans-serif;">${label} →</a>
    </td></tr>
  </table>`
}
function divider() {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
    <tr><td style="border-top:1px solid #1a1a1a;font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`
}
function kv(key, value) {
  return `<tr>
    <td style="padding:8px 0;font-size:12px;color:#555555;letter-spacing:0.04em;width:130px;vertical-align:top;">${key}</td>
    <td style="padding:8px 0;font-size:13px;color:#cccccc;vertical-align:top;">${value}</td>
  </tr>`
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtAmount(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}
function planLabel(id) {
  return id === 'professional' ? 'Professional' : id === 'pro' ? 'Pro' : String(id)
}

// ── Templates ─────────────────────────────────────────────────────────────────

function tplContactFormAutoReply({ name, subject: subjectText, message }) {
  const firstName = (name ?? '').split(' ')[0] || 'there'
  return {
    from:    FROM.info,
    subject: `We received your message — Lumina Design`,
    html: wrap(
      `Thanks for reaching out, ${firstName}. We'll get back to you within one business day.`,
      `
      ${h1(`We've received your message`)}
      ${p(`Hi ${firstName},`)}
      ${p(`Thanks for contacting Lumina Design. We've received your message and will reply within <strong style="color:#ffffff;">1 business day</strong> (Mon–Fri, 9 am–6 pm IST).`)}
      ${divider()}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
        ${kv('Subject', subjectText ?? '—')}
        ${kv('Your message', `<span style="white-space:pre-wrap;font-size:12px;color:#888888;">${String(message ?? '').slice(0, 400).replace(/</g, '&lt;')}</span>`)}
      </table>
      ${p(`In the meantime, if you have a quick technical question you can also try the app — it's free to start with no credit card required.`, 'margin-bottom:8px;')}
      ${ghostBtn('Launch app', APP_URL)}
      ${divider()}
      ${p(`The Lumina team`, 'color:#555555;font-size:13px;margin:0;')}
      `
    ),
  }
}

function tplTrialStarted({ name, email, trialEndsAt }) {
  const firstName = (name ?? email ?? '').split(/[\s@]/)[0] || 'there'
  return {
    from:    FROM.business,
    subject: `Welcome to Lumina Design — your 14-day trial has started`,
    html: wrap(
      `Your free trial is active. Design your first lighting project in minutes.`,
      `
      ${h1(`Welcome to Lumina, ${firstName}`)}
      ${p(`Your 14-day free trial is now active. You have access to everything on the Pro plan — no credit card required.`)}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
        ${kv('Plan', 'Free Trial (Pro features)')}
        ${kv('Trial ends', trialEndsAt ? fmtDate(trialEndsAt) : '14 days from today')}
        ${kv('Account', email ?? '')}
      </table>
      ${divider()}
      <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#444444;letter-spacing:0.1em;text-transform:uppercase;">What you can do right now</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="padding:0 0 12px;font-size:13px;color:#888888;line-height:1.6;">
          <span style="color:#d4a843;margin-right:10px;">→</span>Place fixtures on a canvas and get live lux calculations
        </td></tr>
        <tr><td style="padding:0 0 12px;font-size:13px;color:#888888;line-height:1.6;">
          <span style="color:#d4a843;margin-right:10px;">→</span>Describe your room to the AI — it recommends fixtures and places them
        </td></tr>
        <tr><td style="padding:0 0 12px;font-size:13px;color:#888888;line-height:1.6;">
          <span style="color:#d4a843;margin-right:10px;">→</span>Plan DALI 2.0 circuits and export a driver schedule
        </td></tr>
        <tr><td style="padding:0 0 0;font-size:13px;color:#888888;line-height:1.6;">
          <span style="color:#d4a843;margin-right:10px;">→</span>Export a client-ready PDF report with fixture schedule + lux summary
        </td></tr>
      </table>
      ${goldBtn('Start designing', DASH_URL)}
      ${divider()}
      ${p(`Questions? Reply to this email or write to <a href="mailto:support@lightillumina.com" style="color:#888888;">support@lightillumina.com</a>.`, 'color:#555555;font-size:12px;margin:0;')}
      `
    ),
  }
}

function tplPaymentSuccess({ name, email, planId, paymentId, amount, renewsAt }) {
  const firstName = (name ?? email ?? '').split(/[\s@]/)[0] || 'there'
  return {
    from:    FROM.business,
    subject: `Payment confirmed — ${planLabel(planId)} plan activated`,
    html: wrap(
      `Your ${planLabel(planId)} subscription is now active.`,
      `
      ${h1(`Payment confirmed`)}
      ${p(`Hi ${firstName}, your payment was successful and your <strong style="color:#ffffff;">${planLabel(planId)}</strong> subscription is now active.`)}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:4px;padding:20px;">
        ${kv('Plan', planLabel(planId))}
        ${kv('Amount paid', amount ? fmtAmount(amount) : '—')}
        ${kv('Payment ID', `<span style="font-family:monospace;font-size:11px;color:#666666;">${paymentId ?? '—'}</span>`)}
        ${kv('Next renewal', renewsAt ? fmtDate(renewsAt) : '—')}
        ${kv('Account', email ?? '')}
      </table>
      ${goldBtn('Go to dashboard', DASH_URL)}
      ${divider()}
      ${p(`Keep this email as your payment receipt. For billing queries, contact <a href="mailto:business@lightillumina.com" style="color:#888888;">business@lightillumina.com</a> with your payment ID.`, 'color:#555555;font-size:12px;margin:0;')}
      `
    ),
  }
}

function tplPaymentFailed({ name, email, planId, failureReason }) {
  const firstName = (name ?? email ?? '').split(/[\s@]/)[0] || 'there'
  return {
    from:    FROM.business,
    subject: `Action needed — payment for ${planLabel(planId)} plan failed`,
    html: wrap(
      `Your payment did not go through. Please update your payment method.`,
      `
      ${h1(`Payment unsuccessful`)}
      ${p(`Hi ${firstName}, unfortunately your payment for the <strong style="color:#ffffff;">${planLabel(planId)}</strong> plan did not go through.`)}
      ${failureReason ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">${kv('Reason', failureReason)}</table>` : ''}
      ${p(`Your account remains active. Please retry the payment using a different card or payment method.`)}
      ${goldBtn('Retry payment', SUB_URL)}
      ${divider()}
      <p style="margin:0 0 10px;font-size:13px;color:#666666;line-height:1.6;">Common reasons for payment failure:</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="padding:0 0 8px;font-size:12px;color:#555555;line-height:1.6;">· Insufficient funds or daily limit reached</td></tr>
        <tr><td style="padding:0 0 8px;font-size:12px;color:#555555;line-height:1.6;">· Card expired or blocked for online transactions</td></tr>
        <tr><td style="padding:0 0 0;font-size:12px;color:#555555;line-height:1.6;">· Bank declined — contact your bank or try UPI</td></tr>
      </table>
      ${divider()}
      ${p(`Need help? Contact <a href="mailto:business@lightillumina.com" style="color:#888888;">business@lightillumina.com</a>`, 'color:#555555;font-size:12px;margin:0;')}
      `
    ),
  }
}

function tplSubscriptionExpiring({ name, email, planId, renewsAt, daysLeft }) {
  const firstName = (name ?? email ?? '').split(/[\s@]/)[0] || 'there'
  const dayWord   = daysLeft === 1 ? 'day' : 'days'
  return {
    from:    FROM.business,
    subject: `Your Lumina ${planLabel(planId)} plan renews in ${daysLeft} ${dayWord}`,
    html: wrap(
      `Your subscription renews on ${fmtDate(renewsAt)}.`,
      `
      ${h1(`Your plan renews in ${daysLeft} ${dayWord}`)}
      ${p(`Hi ${firstName}, just a heads-up — your <strong style="color:#ffffff;">${planLabel(planId)}</strong> subscription renews on <strong style="color:#ffffff;">${fmtDate(renewsAt)}</strong>.`)}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
        ${kv('Plan', planLabel(planId))}
        ${kv('Renewal date', fmtDate(renewsAt))}
        ${kv('Account', email ?? '')}
      </table>
      ${p(`No action needed — your subscription renews automatically. To cancel or change your plan, visit the dashboard before the renewal date.`)}
      ${ghostBtn('Manage subscription', SUB_URL)}
      ${divider()}
      ${p(`Questions about your subscription? Contact <a href="mailto:business@lightillumina.com" style="color:#888888;">business@lightillumina.com</a>`, 'color:#555555;font-size:12px;margin:0;')}
      `
    ),
  }
}

function tplSubscriptionExpired({ name, email, planId }) {
  const firstName = (name ?? email ?? '').split(/[\s@]/)[0] || 'there'
  return {
    from:    FROM.business,
    subject: `Your Lumina ${planLabel(planId)} subscription has ended`,
    html: wrap(
      `Reactivate to keep your projects and continue designing.`,
      `
      ${h1(`Your subscription has ended`)}
      ${p(`Hi ${firstName}, your <strong style="color:#ffffff;">${planLabel(planId)}</strong> subscription has expired. Your projects are safely saved — reactivate to continue where you left off.`)}
      ${divider()}
      <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#444444;letter-spacing:0.1em;text-transform:uppercase;">What you keep on the free plan</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="padding:0 0 10px;font-size:13px;color:#888888;line-height:1.6;">
          <span style="color:#555555;margin-right:10px;">✓</span>Up to 3 projects
        </td></tr>
        <tr><td style="padding:0 0 10px;font-size:13px;color:#888888;line-height:1.6;">
          <span style="color:#555555;margin-right:10px;">✓</span>Basic lux calculations
        </td></tr>
        <tr><td style="padding:0 0 0;font-size:13px;color:#888888;line-height:1.6;">
          <span style="color:#555555;margin-right:10px;">✓</span>PDF export
        </td></tr>
      </table>
      ${goldBtn('Reactivate now', SUB_URL)}
      ${divider()}
      ${p(`Need help deciding on a plan? Reply to this email or see <a href="https://lightillumina.com/pricing" style="color:#888888;">pricing</a>.`, 'color:#555555;font-size:12px;margin:0;')}
      `
    ),
  }
}

// ── Template registry ─────────────────────────────────────────────────────────
const TEMPLATES = {
  contact_form_received: tplContactFormAutoReply,
  trial_started:         tplTrialStarted,
  payment_success:       tplPaymentSuccess,
  payment_failed:        tplPaymentFailed,
  subscription_expiring: tplSubscriptionExpiring,
  subscription_expired:  tplSubscriptionExpired,
}

// ── Resend sender ─────────────────────────────────────────────────────────────
async function sendViaResend(apiKey, { from, subject, html }, to) {
  const r = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ from, to: [to], subject, html }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.message ?? `Resend HTTP ${r.status}`)
  return data.id
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * trigger(event, payload)
 * Builds the template and sends via Resend.
 * Always fire-and-forget safe — never throws to the caller.
 *
 * @param {string}  event   — one of the trigger names above
 * @param {object}  payload — { email (required), name, ...event-specific fields }
 * @returns {Promise<{ ok: boolean, id?: string, error?: string }>}
 */
export async function trigger(event, payload = {}) {
  const { email } = payload
  if (!email) return { ok: false, error: 'no recipient email in payload' }

  const tplFn = TEMPLATES[event]
  if (!tplFn) return { ok: false, error: `unknown event: ${event}` }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' }

  try {
    const tpl = tplFn(payload)
    const id  = await sendViaResend(apiKey, tpl, email)
    console.log(`[email-workflows] ✓ ${event} → ${email} (id: ${id})`)
    return { ok: true, id }
  } catch (err) {
    console.error(`[email-workflows] ✗ ${event} → ${email}:`, err.message)
    return { ok: false, error: err.message }
  }
}
