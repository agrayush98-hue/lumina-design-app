/**
 * Vercel serverless function — triggers a Firestore managed export to GCS.
 *
 * Called daily by Vercel Cron (see vercel.json). The export lands in a
 * date-stamped folder inside GCS_BACKUP_BUCKET. Firestore Managed Exports
 * can be used to restore individual collections or the whole database via
 * the GCP Console → Firestore → Import/Export.
 *
 * Required env vars (Vercel → Settings → Environment Variables):
 *   FIREBASE_SERVICE_ACCOUNT  — service-account JSON as single-line string
 *   GCS_BACKUP_BUCKET         — GCS bucket name, e.g. "lumina-firestore-backups"
 *                               (create it first: gsutil mb gs://lumina-firestore-backups)
 *   CRON_SECRET               — arbitrary secret; Vercel sends it as
 *                               Authorization: Bearer <CRON_SECRET> on cron calls
 *
 * GCP IAM requirement:
 *   The service account in FIREBASE_SERVICE_ACCOUNT needs the
 *   "Cloud Datastore Import Export Admin" role on the GCP project
 *   AND Storage Object Admin on GCS_BACKUP_BUCKET.
 *   Grant via: https://console.cloud.google.com/iam-admin/iam
 *
 * Manual trigger (for testing):
 *   curl -X POST https://<your-domain>/api/backup-firestore \
 *     -H "Authorization: Bearer <CRON_SECRET>"
 */

import crypto from 'crypto'

// ── Google OAuth2 — JWT → access token ───────────────────────────────────────
// We derive a short-lived Google access token from the service account's
// private key so we can call the Firestore REST Admin API.

async function getGoogleAccessToken(serviceAccount) {
  const now     = Math.floor(Date.now() / 1000)
  const expiry  = now + 3600  // 1 hour

  const header  = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss:   serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/devstorage.read_write',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   expiry,
  }

  const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const signingInput = `${encode(header)}.${encode(payload)}`

  // Sign with the service account's RSA private key
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signingInput)
  const signature = signer.sign(serviceAccount.private_key, 'base64url')
  const jwt = `${signingInput}.${signature}`

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`Failed to get Google access token: ${JSON.stringify(tokenData)}`)
  }
  return tokenData.access_token
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Only POST (Vercel cron uses GET by default, but we'll accept both)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Step 1: verify cron secret ────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[backup-firestore] CRON_SECRET not set')
    return res.status(500).json({ error: 'CRON_SECRET not configured' })
  }

  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.authorization ?? ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (token !== cronSecret) {
    console.warn('[backup-firestore] Unauthorized request — wrong or missing CRON_SECRET')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // ── Step 2: parse service account ─────────────────────────────────────────
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) {
    return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT not set' })
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(raw)
  } catch (e) {
    return res.status(500).json({ error: `Cannot parse FIREBASE_SERVICE_ACCOUNT: ${e.message}` })
  }

  const projectId = serviceAccount.project_id
  if (!projectId) {
    return res.status(500).json({ error: 'project_id missing from service account JSON' })
  }

  // ── Step 3: resolve GCS bucket ────────────────────────────────────────────
  const bucket = process.env.GCS_BACKUP_BUCKET
  if (!bucket) {
    return res.status(500).json({ error: 'GCS_BACKUP_BUCKET not set' })
  }

  // Date-stamped folder so each daily run is isolated
  const datestamp = new Date().toISOString().slice(0, 10)   // YYYY-MM-DD
  const outputUri = `gs://${bucket}/${datestamp}`

  console.log('[backup-firestore] Starting export — project:', projectId,
    '| bucket:', bucket, '| folder:', datestamp)

  // ── Step 4: get Google access token ──────────────────────────────────────
  let accessToken
  try {
    accessToken = await getGoogleAccessToken(serviceAccount)
    console.log('[backup-firestore] Access token obtained OK')
  } catch (e) {
    console.error('[backup-firestore] Token error:', e.message)
    return res.status(500).json({ error: `Auth failed: ${e.message}` })
  }

  // ── Step 5: trigger Firestore export ──────────────────────────────────────
  // Exports users + projects only. Exclude internal Firebase collections.
  const exportUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default):exportDocuments`

  const exportBody = {
    outputUriPrefix: outputUri,
    collectionIds:   ['users', 'projects'],  // explicit — avoids exporting internal collections
  }

  try {
    const exportRes = await fetch(exportUrl, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportBody),
    })

    const exportData = await exportRes.json()
    console.log('[backup-firestore] Firestore export API response HTTP', exportRes.status)

    if (!exportRes.ok) {
      console.error('[backup-firestore] Export failed:', JSON.stringify(exportData))
      return res.status(502).json({
        error:    'Firestore export API returned error',
        details:  exportData?.error?.message ?? JSON.stringify(exportData),
        httpCode: exportRes.status,
      })
    }

    // The export is async — the operation name lets you poll for completion
    const operationName = exportData.name ?? '(unknown)'
    console.log('[backup-firestore] ✓ Export started — operation:', operationName,
      '| destination:', outputUri)

    return res.status(200).json({
      success:       true,
      operationName,
      outputUri,
      exportedAt:    new Date().toISOString(),
      collectionIds: exportBody.collectionIds,
    })
  } catch (e) {
    console.error('[backup-firestore] fetch threw:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
