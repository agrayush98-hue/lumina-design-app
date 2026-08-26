import { getAdminAuth } from './_adminDb.js'

export default async function handler(req, res) {
  const token = req.headers['x-app-token'] ?? ''
  const secret = process.env.APP_SECRET_TOKEN ?? process.env.VITE_APP_SECRET_TOKEN ?? 'lumina-secret-2024'

  if (token !== secret) {
    return res.status(401).send('Unauthorized')
  }

  try {
    const auth = getAdminAuth()
    await auth.setCustomUserClaims('2kDCxqcBkHNPz6IcdN573lI1Lxh2', { plan: 'professional', subStatus: 'active' })
    console.log('[temp-stamp-claims] Done — claim stamped for 2kDCxqcBkHNPz6IcdN573lI1Lxh2')
    return res.status(200).send('Done — claim stamped for 2kDCxqcBkHNPz6IcdN573lI1Lxh2')
  } catch (e) {
    console.error('[temp-stamp-claims] Error:', e.message)
    return res.status(500).send('Error: ' + e.message)
  }
}
