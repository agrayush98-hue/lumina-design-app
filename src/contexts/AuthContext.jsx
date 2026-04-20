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

    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)

    const docData = {
      email,
      name,
      createdAt:    serverTimestamp(),
      trialEndsAt:  Timestamp.fromDate(trialEnd),
      subscription: {
        status:            'trial',   // trial | active | expired
        plan:              null,
        razorpayCustomerId: null,
        razorpaySubId:      null,
      },
      aiUsage: {
        totalCalls:  0,
        thisMonth:   0,
        lastReset:   serverTimestamp(),
      },
    }

    await setDoc(doc(db, 'users', cred.user.uid), docData)
    setUserDoc(docData)
    return cred
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
        await fetchUserDoc(firebaseUser.uid)
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
