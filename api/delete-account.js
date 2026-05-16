/**
 * Vercel serverless function — full account deletion with cascade.
 *
 * Deletes (in order):
 *   1. All projects where userId == uid          (projects/ collection)
 *   2. User subcollections: profile/data, billing/*, fixtures/*
 *   3. Root users/{uid} document
 *   4. Firebase Auth account
 *
 * Auth: caller must send their Firebase ID token in the Authorization header.
 *   Authorization: Bearer <firebase-id-token>
 */

import { getAdminDb, getAdminAuth } from './_adminDb.js'

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

async function deleteCollection(db, collRef) {
  const snap = await collRef.get()
  if (snap.empty) return
  const batch = db.batch()
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

export default async function handler(req, res) {
  const cors = corsHeaders(req)
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // ── Step 1: verify Firebase ID token ──────────────────────────────────────
  const authHeader = req.headers.authorization ?? ''
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!idToken) {
    return res.status(401).json({ error: 'Missing Authorization header.' })
  }

  let adminAuth, db
  try {
    adminAuth = getAdminAuth()
    db        = getAdminDb()
  } catch (e) {
    console.error('[delete-account] Admin SDK init failed:', e.message)
    return res.status(500).json({ error: 'Server configuration error.' })
  }

  let decodedToken
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken)
  } catch (e) {
    console.error('[delete-account] Token verification failed:', e.message)
    return res.status(401).json({ error: 'Invalid or expired auth token.' })
  }

  const uid = decodedToken.uid

  // ── Step 2: delete all user projects ─────────────────────────────────────
  try {
    const projectsSnap = await db.collection('projects').where('userId', '==', uid).get()
    if (!projectsSnap.empty) {
      const batch = db.batch()
      projectsSnap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
      console.log(`[delete-account] Deleted ${projectsSnap.size} projects for uid:`, uid)
    }
  } catch (e) {
    console.error('[delete-account] Failed to delete projects:', e.message)
    // Non-fatal — continue with user doc deletion
  }

  // ── Step 3: delete user subcollections ────────────────────────────────────
  const subcollections = ['billing', 'fixtures']
  for (const sub of subcollections) {
    try {
      await deleteCollection(db, db.collection(`users/${uid}/${sub}`))
    } catch (e) {
      console.error(`[delete-account] Failed to delete subcollection ${sub}:`, e.message)
    }
  }
  // profile/data is a single doc, not a collection
  try {
    await db.doc(`users/${uid}/profile/data`).delete()
  } catch (e) {
    console.error('[delete-account] Failed to delete profile/data:', e.message)
  }

  // ── Step 4: delete root user document ─────────────────────────────────────
  try {
    await db.doc(`users/${uid}`).delete()
    console.log('[delete-account] Deleted users doc for uid:', uid)
  } catch (e) {
    console.error('[delete-account] Failed to delete user doc:', e.message)
    return res.status(500).json({ error: 'Failed to delete user data.' })
  }

  // ── Step 5: delete Firebase Auth account ──────────────────────────────────
  try {
    await adminAuth.deleteUser(uid)
    console.log('[delete-account] Deleted Auth account for uid:', uid)
  } catch (e) {
    console.error('[delete-account] Failed to delete Auth account:', e.message)
    return res.status(500).json({ error: 'Data deleted but Auth account removal failed. Contact support.' })
  }

  return res.status(200).json({ success: true })
}
