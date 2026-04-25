import { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import {
  doc, setDoc, getDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

const TRIAL_DAYS = 14

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
    }

    await setDoc(doc(db, 'users', uid), rootData)

    // Write profile/data subcollection so Dashboard.jsx can read createdAt
    await setDoc(doc(db, 'users', uid, 'profile', 'data'), {
      createdAt:   serverTimestamp(),
      displayName: displayName ?? '',
      email:       email ?? '',
      updatedAt:   serverTimestamp(),
    })

    setUserDoc(rootData)
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

  // ── Load user document from Firestore ───────────────────────────
  async function fetchUserDoc(uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) setUserDoc(snap.data())
    } catch (err) {
      console.error('fetchUserDoc:', err)
    }
  }

  // ── Derived trial / subscription status ────────────────────────
  function getTrialStatus() {
    if (!userDoc) return { status: 'loading' }

    const { subscription, trialEndsAt } = userDoc

    if (subscription?.status === 'active') {
      return { status: 'active', plan: subscription.plan }
    }

    const now      = new Date()
    const end      = trialEndsAt?.toDate?.() ?? now
    const msLeft   = end - now
    const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000))

    if (daysLeft <= 0) return { status: 'expired', daysLeft: 0 }
    return { status: 'trial', daysLeft }
  }

  // ── Listen for auth state changes ───────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (!snap.exists()) {
          await _initUserDocs(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName,
          )
        } else {
          await fetchUserDoc(firebaseUser.uid)
        }
      } else {
        setUserDoc(null)
      }
      setLoading(false)
    })
    return unsub
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
    refetchUserDoc: () => user && fetchUserDoc(user.uid),
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
