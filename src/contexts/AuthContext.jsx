import { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import {
  doc, setDoc, getDoc, onSnapshot, updateDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import {
  emailWelcome,
  emailTrialExpiringSoon,
  emailTrialExpired,
} from '../emails/templates'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

const TRIAL_DAYS = 14

// ── Email helper — fire-and-forget, never blocks auth flow ─────────────────────
async function dispatchEmail(to, subject, html) {
  if (!to) {
    console.error('[AuthContext] dispatchEmail — no recipient address, skipping')
    return
  }
  try {
    // send-email.js requires a Firebase ID token to prevent open-relay abuse
    const idToken = await auth.currentUser?.getIdToken?.().catch(() => null) ?? null
    const r    = await fetch('/api/send-email', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ to, subject, html }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      console.error('[AuthContext] dispatchEmail — Resend rejected (HTTP', r.status + '):', data)
    }
  } catch (err) {
    console.error('[AuthContext] dispatchEmail — network error:', err.message)
  }
}

// Mark an email as sent in Firestore so we don't re-send on next login
async function markEmailSent(uid, key) {
  try {
    await updateDoc(doc(db, 'users', uid), { [`emailsSent.${key}`]: true })
  } catch {
    // Non-fatal — worst case we send a duplicate email
  }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Create account ──────────────────────────────────────────────
  async function signup(email, password, name = '') {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await _initUserDocs(cred.user.uid, email, name)
    return cred
  }

  // ── Create root doc + profile/data subcollection ─────────────────
  async function _initUserDocs(uid, email, displayName) {
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)

    const rootData = {
      email:        email ?? '',
      name:         displayName ?? '',
      createdAt:    serverTimestamp(),
      trialEndsAt:  Timestamp.fromDate(trialEnd),
      subscription: {
        status:             'trial',
        plan:               'trial',
        razorpayCustomerId: null,
        razorpaySubId:      null,
      },
      aiUsage: {
        totalCalls: 0,
        thisMonth:  0,
        lastReset:  serverTimestamp(),
      },
      emailsSent: {},
    }

    try {
      await setDoc(doc(db, 'users', uid), rootData)
      await setDoc(doc(db, 'users', uid, 'profile', 'data'), {
        createdAt:   serverTimestamp(),
        displayName: displayName ?? '',
        email:       email ?? '',
        updatedAt:   serverTimestamp(),
      })
    } catch (err) {
      console.error('[AuthContext] _initUserDocs — Firestore write failed:', err.message)
      throw err
    }

    setUserDoc(rootData)

    // Welcome email — fire after docs are written, don't await
    dispatchEmail(
      email,
      'Welcome to Lumina Design — Your 14-day trial has started',
      emailWelcome({ name: displayName, trialEndsAt: trialEnd }),
    ).then(() => {
      markEmailSent(uid, 'welcome')
    }).catch(err => console.error('[AuthContext] welcome email dispatch failed:', err.message))
  }

  // ── Check & send trial lifecycle emails on login ──────────────────
  async function _checkTrialEmails(uid, data) {
    const { emailsSent = {}, subscription, trialEndsAt, email, name } = data

    // Skip entirely for paid / cancelled users
    if (subscription?.status === 'active' || subscription?.status === 'cancelled') return

    const now      = new Date()
    const end      = trialEndsAt?.toDate?.() ?? now
    const daysLeft = Math.ceil((end - now) / 86_400_000)

    if (daysLeft <= 0 && !emailsSent.trialExpired) {
      markEmailSent(uid, 'trialExpired')
      dispatchEmail(
        email,
        'Your Lumina Design trial has ended',
        emailTrialExpired({ name }),
      )
      return
    }

    if (daysLeft <= 3 && daysLeft > 0 && !emailsSent.trialWarning) {
      markEmailSent(uid, 'trialWarning')
      dispatchEmail(
        email,
        `Your Lumina Design trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
        emailTrialExpiringSoon({ name, trialEndsAt: end, daysLeft }),
      )
    }
  }

  // ── Sign in ─────────────────────────────────────────────────────
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // ── Sign out ────────────────────────────────────────────────────
  async function logout() {
    setUserDoc(null)
    return signOut(auth)
  }

  // ── Password reset ──────────────────────────────────────────────
  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  // ── Derived trial / subscription status ────────────────────────
  function getTrialStatus() {
    if (!userDoc) return { status: 'loading' }

    const { subscription, trialEndsAt } = userDoc
    const now = new Date()

    if (subscription?.status === 'active') {
      // Enforce renewsAt — treat as expired if billing period has lapsed
      const renewsAt = subscription.renewsAt?.toDate?.() ?? subscription.renewsAt ?? null
      if (renewsAt && renewsAt < now) {
        // Billing period ended — access should be revoked until renewed
        return { status: 'expired', daysLeft: 0, plan: subscription.plan, subscriptionExpired: true }
      }
      return { status: 'active', plan: subscription.plan }
    }

    // 'cancelled' — user keeps access until renewsAt, then expires
    if (subscription?.status === 'cancelled') {
      const accessUntil = subscription.renewsAt?.toDate?.() ?? subscription.renewsAt ?? null
      if (accessUntil && accessUntil > now) {
        const daysLeft = Math.max(0, Math.ceil((accessUntil - now) / 86_400_000))
        return { status: 'cancelled', daysLeft, plan: subscription.plan, accessUntil }
      }
      return { status: 'expired', daysLeft: 0 }
    }

    // Trial path
    const end      = trialEndsAt?.toDate?.() ?? now
    const msLeft   = end - now
    const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000))

    if (daysLeft <= 0) return { status: 'expired', daysLeft: 0 }
    return { status: 'trial', daysLeft }
  }

  // ── Listen for auth state changes + keep userDoc live ───────────
  useEffect(() => {
    let docUnsub = null

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (docUnsub) { docUnsub(); docUnsub = null }

      setUser(firebaseUser)

      if (firebaseUser) {
        const ref = doc(db, 'users', firebaseUser.uid)
        try {
          const snap = await getDoc(ref)
          if (!snap.exists()) {
            await _initUserDocs(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName)
          } else {
            const data = snap.data()
            setUserDoc(data)
            // Check trial lifecycle emails each time user authenticates
            _checkTrialEmails(firebaseUser.uid, data)
          }
        } catch (err) {
          console.error('[AuthContext] onAuthStateChanged — getDoc failed:', err.message)
        }

        docUnsub = onSnapshot(ref,
          (s) => { if (s.exists()) setUserDoc(s.data()) },
          (err) => console.error('[AuthContext] userDoc listener:', err),
        )
      } else {
        setUserDoc(null)
      }

      setLoading(false)
    })

    return () => { authUnsub(); if (docUnsub) docUnsub() }
  }, [])

  const value = {
    user,
    userDoc,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    getTrialStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
