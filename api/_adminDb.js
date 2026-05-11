/**
 * Shared Firebase Admin SDK initialiser for Vercel serverless functions.
 * Import getAdminDb() wherever you need server-side Firestore access.
 *
 * Required env var: FIREBASE_SERVICE_ACCOUNT
 *   Full service-account JSON as a single-line string.
 *   Set in Vercel → Settings → Environment Variables.
 */

let _adminDb   = null
let _adminAuth = null
let _initError = null

function _init() {
  if (_adminDb)   return
  if (_initError) throw _initError

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) {
    _initError = new Error('FIREBASE_SERVICE_ACCOUNT env var is not set')
    throw _initError
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(raw)
  } catch (e) {
    _initError = new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${e.message}`)
    throw _initError
  }

  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app')
    const { getFirestore }                  = require('firebase-admin/firestore')
    const { getAuth }                       = require('firebase-admin/auth')

    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) })
    }

    _adminDb   = getFirestore()
    _adminAuth = getAuth()
  } catch (e) {
    _initError = new Error(`Firebase Admin init failed: ${e.message}`)
    throw _initError
  }
}

export function getAdminDb() {
  _init()
  return _adminDb
}

export function getAdminAuth() {
  _init()
  return _adminAuth
}
