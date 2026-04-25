// Lumina Design — transactional email templates
// All templates return an HTML string ready for Resend.
// Design: black background, #d4a843 gold accent, table-based layout (email-client safe).

const APP_URL  = 'https://app.lightillumina.com'
const DASH_URL = `${APP_URL}/dashboard`
const SUB_URL  = `${DASH_URL}?tab=subscription`

// ── Shared helpers ─────────────────────────────────────────────────────────────

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function goldBtn(text, href) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="border-radius:3px;background:#d4a843;">
          <a href="${href}" target="_blank"
             style="display:inline-block;padding:12px 28px;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:12px;font-weight:700;color:#000000;text-decoration:none;
                    letter-spacing:0.1em;text-transform:uppercase;border-radius:3px;">${text}</a>
        </td>
      </tr>
    </table>`
}

function outlineBtn(text, href) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="border-radius:3px;border:1px solid #333333;">
          <a href="${href}" target="_blank"
             style="display:inline-block;padding:11px 28px;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:12px;font-weight:500;color:#888888;text-decoration:none;
                    letter-spacing:0.06em;border-radius:3px;">Go to app →</a>
        </td>
      </tr>
    </table>`
}

function featureRow(icon, title, desc) {
  return `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td width="32" valign="top" style="padding-top:1px;">
              <span style="font-size:16px;">${icon}</span>
            </td>
            <td>
              <p style="margin:0 0 2px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:13px;font-weight:600;color:#ffffff;">${title}</p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:12px;color:#666666;line-height:1.5;">${desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

function shell(bodyRows) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Lumina Design</title>
</head>
<body style="margin:0;padding:0;background:#000000;-webkit-font-smoothing:antialiased;mso-line-height-rule:exactly;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#000000;">
    <tr>
      <td align="center" style="padding:48px 16px 40px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="max-width:560px;width:100%;">

          <!-- ── Logo ── -->
          <tr>
            <td style="padding:0 0 28px 0;">
              <a href="${APP_URL}" target="_blank" style="text-decoration:none;">
                <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;
                             color:#ffffff;letter-spacing:0.14em;">LUMINA</span><span
                      style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:300;
                             color:#444444;letter-spacing:0.14em;"> DESIGN</span>
              </a>
            </td>
          </tr>

          <!-- ── Gold rule ── -->
          <tr>
            <td style="padding:0 0 36px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="height:1px;background:linear-gradient(90deg,#d4a843,#b8902f);font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          ${bodyRows}

          <!-- ── Divider ── -->
          <tr>
            <td style="padding:36px 0 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="height:1px;background:#111111;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding:20px 0 0 0;">
              <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:10px;color:#333333;letter-spacing:0.04em;">
                © 2025 Lumina Design ·
                <a href="${APP_URL}" style="color:#444444;text-decoration:none;">lightillumina.com</a>
              </p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:10px;color:#2a2a2a;letter-spacing:0.02em;">
                You received this because you have a Lumina Design account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── EMAIL 1 — Welcome + Trial Started ─────────────────────────────────────────

export function emailWelcome({ name, trialEndsAt }) {
  const displayName  = name ? name.split(' ')[0] : 'there'
  const trialEndDate = fmtDate(trialEndsAt)

  const body = `
    <tr>
      <td style="padding:0 0 8px 0;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:11px;font-weight:600;color:#d4a843;letter-spacing:0.14em;text-transform:uppercase;">
          WELCOME TO LUMINA DESIGN
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 24px 0;">
        <h1 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">
          Your 14-day free trial<br>has started, ${displayName}.
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 28px 0;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:14px;color:#888888;line-height:1.7;">
          You have full access to every Lumina Design feature until
          <strong style="color:#d4a843;">${trialEndDate}</strong>.
          No credit card required during your trial.
        </p>
      </td>
    </tr>

    <!-- Trial pill -->
    <tr>
      <td style="padding:0 0 32px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background:#0d0d0d;border:1px solid #1e1e1e;border-left:3px solid #d4a843;
                       border-radius:3px;padding:14px 20px;">
              <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:10px;font-weight:600;color:#d4a843;letter-spacing:0.12em;text-transform:uppercase;">
                FREE TRIAL
              </p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:13px;color:#cccccc;">
                14 days full access · Expires <strong>${trialEndDate}</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Features -->
    <tr>
      <td style="padding:0 0 8px 0;">
        <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:11px;font-weight:600;color:#555555;letter-spacing:0.1em;text-transform:uppercase;">
          EVERYTHING INCLUDED
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${featureRow('💡', 'Photometric Design', 'Place fixtures, calculate lux levels, visualise beam spreads and heatmaps in real-time.')}
          ${featureRow('⚡', 'DALI 2.0 Addressing', 'Automatic bus addressing, cable length calculations and topology planning.')}
          ${featureRow('📐', 'Floor Plan Upload', 'Import PDF or image floor plans, calibrate scale and draw room boundaries.')}
          ${featureRow('📊', 'Export Reports', 'Generate professional PDF reports, BOQ spreadsheets and PNG exports.')}
          ${featureRow('✦', 'AI Fixture Recommendations', 'Get AI-powered fixture suggestions optimised for your room type and lux target.')}
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 0 0 0;">
        ${goldBtn('Open Lumina Design →', DASH_URL)}
      </td>
    </tr>`

  return shell(body)
}

// ── EMAIL 2 — Trial Expiring Soon (3 days) ────────────────────────────────────

export function emailTrialExpiringSoon({ name, trialEndsAt, daysLeft }) {
  const displayName  = name ? name.split(' ')[0] : 'there'
  const trialEndDate = fmtDate(trialEndsAt)

  const body = `
    <tr>
      <td style="padding:0 0 8px 0;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:11px;font-weight:600;color:#d4a843;letter-spacing:0.14em;text-transform:uppercase;">
          TRIAL ENDING SOON
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 24px 0;">
        <h1 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">
          ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left on your<br>free trial, ${displayName}.
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 28px 0;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:14px;color:#888888;line-height:1.7;">
          Your trial expires on <strong style="color:#ffffff;">${trialEndDate}</strong>.
          After that, access to DALI, exports, floor plan upload and AI recommendations
          will be locked until you upgrade.
        </p>
      </td>
    </tr>

    <!-- What you'll lose -->
    <tr>
      <td style="padding:0 0 28px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
               style="background:#0a0a0a;border:1px solid #1e1e1e;border-radius:4px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 14px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:10px;font-weight:600;color:#555555;letter-spacing:0.1em;text-transform:uppercase;">
                LOCKED AFTER TRIAL ENDS
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="50%" valign="top" style="padding:0 8px 8px 0;">
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#888888;">
                      🔒 DALI 2.0 Addressing
                    </p>
                  </td>
                  <td width="50%" valign="top" style="padding:0 0 8px 0;">
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#888888;">
                      🔒 PDF / Excel Export
                    </p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" valign="top" style="padding:0 8px 0 0;">
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#888888;">
                      🔒 Floor Plan Upload
                    </p>
                  </td>
                  <td width="50%" valign="top">
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#888888;">
                      🔒 AI Recommendations
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Pricing -->
    <tr>
      <td style="padding:0 0 28px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
               style="background:#0a0a0a;border:1px solid #222222;border-top:2px solid #d4a843;border-radius:4px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:11px;font-weight:700;color:#d4a843;letter-spacing:0.1em;">PRO PLAN</p>
              <p style="margin:0 0 10px 0;">
                <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:24px;font-weight:700;color:#ffffff;">₹1,179</span>
                <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#555555;"> / month</span>
              </p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#666666;line-height:1.6;">
                All features unlocked · 10 projects · Cancel anytime
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:0 0 12px 0;">
        ${goldBtn('Upgrade to PRO →', SUB_URL)}
      </td>
    </tr>
    <tr>
      <td>
        ${outlineBtn('Continue using my trial', DASH_URL)}
      </td>
    </tr>`

  return shell(body)
}

// ── EMAIL 3 — Trial Expired ────────────────────────────────────────────────────

export function emailTrialExpired({ name }) {
  const displayName = name ? name.split(' ')[0] : 'there'

  const body = `
    <tr>
      <td style="padding:0 0 8px 0;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:11px;font-weight:600;color:#888888;letter-spacing:0.14em;text-transform:uppercase;">
          TRIAL ENDED
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 24px 0;">
        <h1 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">
          Your free trial has ended,<br>${displayName}.
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 28px 0;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:14px;color:#888888;line-height:1.7;">
          Your 14-day trial is over. Your project data is safe and your account is still active —
          upgrade to regain full access to DALI, exports, floor plans and AI recommendations.
        </p>
      </td>
    </tr>

    <!-- Plan cards -->
    <tr>
      <td style="padding:0 0 28px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <!-- PRO -->
            <td width="48%" valign="top"
                style="background:#0a0a0a;border:1px solid #222222;border-top:2px solid #d4a843;
                       border-radius:4px;padding:20px;">
              <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:10px;font-weight:700;color:#d4a843;letter-spacing:0.12em;">PRO</p>
              <p style="margin:0 0 8px 0;">
                <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;">₹1,179</span>
                <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#555555;">/mo</span>
              </p>
              <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#666666;">10 projects</p>
              <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#666666;">All features</p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#666666;">Cancel anytime</p>
            </td>
            <td width="4%">&nbsp;</td>
            <!-- PROFESSIONAL -->
            <td width="48%" valign="top"
                style="background:#0a0a0a;border:1px solid #333333;border-radius:4px;padding:20px;">
              <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:10px;font-weight:700;color:#888888;letter-spacing:0.12em;">PROFESSIONAL</p>
              <p style="margin:0 0 8px 0;">
                <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;">₹2,949</span>
                <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#555555;">/mo</span>
              </p>
              <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#666666;">Unlimited projects</p>
              <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#666666;">All features</p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#666666;">Priority support</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:0 0 12px 0;">
        ${goldBtn('Choose a plan →', SUB_URL)}
      </td>
    </tr>
    <tr>
      <td>
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:12px;color:#444444;">
          Your projects are saved. We'll keep them for 30 days.
        </p>
      </td>
    </tr>`

  return shell(body)
}

// ── EMAIL 4 — Payment Success / PRO Activated ─────────────────────────────────

export function emailPaymentSuccess({ name, plan, amount, paymentId, activatedAt, renewalDate }) {
  const displayName   = name ? name.split(' ')[0] : 'there'
  const planLabel     = plan === 'professional' ? 'PROFESSIONAL' : 'PRO'
  const activatedDate = fmtDate(activatedAt ?? new Date())
  const renewalStr    = renewalDate ? fmtDate(renewalDate) : null

  const body = `
    <!-- Gold check header -->
    <tr>
      <td style="padding:0 0 24px 0;" align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width:56px;height:56px;background:#0d0d0d;border:1px solid #2a2a2a;
                       border-radius:50%;text-align:center;vertical-align:middle;">
              <span style="font-size:24px;line-height:56px;">✓</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 8px 0;" align="center">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:11px;font-weight:600;color:#d4a843;letter-spacing:0.14em;text-transform:uppercase;">
          PAYMENT SUCCESSFUL
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 28px 0;" align="center">
        <h1 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;text-align:center;">
          Welcome to ${planLabel}, ${displayName}!
        </h1>
      </td>
    </tr>

    <!-- Receipt block -->
    <tr>
      <td style="padding:0 0 28px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
               style="background:#0a0a0a;border:1px solid #1e1e1e;border-radius:4px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:10px;font-weight:600;color:#555555;letter-spacing:0.1em;text-transform:uppercase;">
                PAYMENT RECEIPT
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding:0 0 10px 0;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#555555;">Plan</span>
                  </td>
                  <td align="right" style="padding:0 0 10px 0;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:600;color:#d4a843;">${planLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 10px 0;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#555555;">Amount</span>
                  </td>
                  <td align="right" style="padding:0 0 10px 0;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#ffffff;">₹${amount}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 10px 0;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#555555;">Activated</span>
                  </td>
                  <td align="right" style="padding:0 0 10px 0;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#ffffff;">${activatedDate}</span>
                  </td>
                </tr>
                ${renewalStr ? `
                <tr>
                  <td style="padding:0 0 10px 0;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#555555;">Next renewal</span>
                  </td>
                  <td align="right" style="padding:0 0 10px 0;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#ffffff;">${renewalStr}</span>
                  </td>
                </tr>` : ''}
                ${paymentId ? `
                <tr>
                  <td>
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#333333;">Payment ID</span>
                  </td>
                  <td align="right">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#333333;word-break:break-all;">${paymentId}</span>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- What's unlocked -->
    <tr>
      <td style="padding:0 0 8px 0;">
        <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:11px;font-weight:600;color:#555555;letter-spacing:0.1em;text-transform:uppercase;">
          NOW FULLY UNLOCKED
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${featureRow('⚡', 'DALI 2.0 Addressing', 'Full bus addressing, cable calculations and topology planning.')}
          ${featureRow('📊', 'All Export Formats', 'PDF reports, Excel BOQ, PNG canvas exports.')}
          ${featureRow('📐', 'Floor Plan Upload', 'PDF and image floor plans with scale calibration.')}
          ${featureRow('✦', 'AI Recommendations', 'AI-powered fixture suggestions for any room type.')}
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 0 0 0;">
        ${goldBtn('Open Lumina Design →', DASH_URL)}
      </td>
    </tr>`

  return shell(body)
}

// ── EMAIL 5 — Subscription Cancelled ─────────────────────────────────────────

export function emailSubscriptionCancelled({ name, plan, accessUntil }) {
  const displayName  = name ? name.split(' ')[0] : 'there'
  const planLabel    = plan === 'professional' ? 'Professional' : 'Pro'
  const accessDate   = accessUntil ? fmtDate(accessUntil) : null

  const body = `
    <tr>
      <td style="padding:0 0 8px 0;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:11px;font-weight:600;color:#888888;letter-spacing:0.14em;text-transform:uppercase;">
          SUBSCRIPTION CANCELLED
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 24px 0;">
        <h1 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">
          Your ${planLabel} plan<br>has been cancelled.
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 24px 0;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:14px;color:#888888;line-height:1.7;">
          Hi ${displayName}, we've processed your cancellation.
          ${accessDate
            ? `You'll keep full ${planLabel} access until <strong style="color:#ffffff;">${accessDate}</strong>, after which your account moves to the free plan.`
            : `Your account will revert to the free plan at the end of your current billing period.`}
        </p>
      </td>
    </tr>

    <!-- Info block -->
    <tr>
      <td style="padding:0 0 28px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
               style="background:#0a0a0a;border:1px solid #1e1e1e;border-radius:4px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 10px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:13px;color:#cccccc;line-height:1.6;">
                Your projects and data are <strong>not deleted</strong>. You can resubscribe anytime to restore full access.
              </p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                         font-size:12px;color:#555555;line-height:1.6;">
                On the free plan you can still view 3 projects and use basic features.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Resubscribe CTA -->
    <tr>
      <td style="padding:0 0 12px 0;">
        ${goldBtn('Resubscribe →', SUB_URL)}
      </td>
    </tr>
    <tr>
      <td>
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:12px;color:#444444;">
          Changed your mind? You can resubscribe at any time from your dashboard.
        </p>
      </td>
    </tr>`

  return shell(body)
}

// ── EMAIL 6 — Monthly Invoice / Payment Receipt ────────────────────────────────

export function emailMonthlyInvoice({ name, plan, amount, paymentId, billingDate, nextBillingDate }) {
  const displayName   = name ? name.split(' ')[0] : 'there'
  const planLabel     = plan === 'professional' ? 'PROFESSIONAL' : 'PRO'
  const billedDate    = fmtDate(billingDate ?? new Date())
  const nextBillStr   = nextBillingDate ? fmtDate(nextBillingDate) : null
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase().slice(-8)}`

  const body = `
    <tr>
      <td style="padding:0 0 8px 0;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:11px;font-weight:600;color:#d4a843;letter-spacing:0.14em;text-transform:uppercase;">
          INVOICE
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 24px 0;">
        <h1 style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">
          Your Lumina ${planLabel}<br>invoice for ${billedDate}.
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 28px 0;">
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                   font-size:14px;color:#888888;line-height:1.7;">
          Hi ${displayName}, thank you for your continued subscription.
          Here's your payment confirmation for this billing period.
        </p>
      </td>
    </tr>

    <!-- Invoice table -->
    <tr>
      <td style="padding:0 0 28px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
               style="background:#0a0a0a;border:1px solid #1e1e1e;border-radius:4px;">
          <tr>
            <td style="padding:20px 24px 0 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin:0 0 2px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#444444;letter-spacing:0.08em;text-transform:uppercase;">Invoice</p>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#888888;">${invoiceNumber}</p>
                  </td>
                  <td align="right">
                    <p style="margin:0 0 2px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#444444;letter-spacing:0.08em;text-transform:uppercase;">Date</p>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#888888;">${billedDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                     style="border-top:1px solid #1a1a1a;">
                <tr>
                  <td style="padding:14px 0 14px 0;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#cccccc;">
                      Lumina Design ${planLabel} · Monthly
                    </span>
                  </td>
                  <td align="right" style="padding:14px 0 14px 0;">
                    <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#ffffff;">₹${amount}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;border-top:1px solid #1a1a1a;" colspan="2">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding:12px 0 0 0;">
                          <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;color:#d4a843;letter-spacing:0.06em;">TOTAL PAID</span>
                        </td>
                        <td align="right" style="padding:12px 0 0 0;">
                          <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;color:#d4a843;">₹${amount}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${paymentId ? `
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#333333;">
                Payment ID: ${paymentId}
              </p>
            </td>
          </tr>` : ''}
        </table>
      </td>
    </tr>

    ${nextBillStr ? `
    <tr>
      <td style="padding:0 0 28px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
               style="background:#0a0a0a;border:1px solid #1e1e1e;border-left:3px solid #222222;border-radius:3px;">
          <tr>
            <td style="padding:14px 20px;">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#666666;">
                Your next billing date is <strong style="color:#cccccc;">${nextBillStr}</strong>.
                Manage your subscription in your <a href="${SUB_URL}" style="color:#d4a843;text-decoration:none;">dashboard</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ''}

    <!-- CTA -->
    <tr>
      <td>
        ${outlineBtn('Go to dashboard', DASH_URL)}
      </td>
    </tr>`

  return shell(body)
}
