import { initializeApp } from "firebase/app"
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc, setDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, orderBy, query, where, Timestamp, serverTimestamp, increment } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db   = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
export const auth = getAuth(app)

export async function saveProject(projectId, projectData, userId) {
  const data = { ...projectData, userId, updatedAt: new Date() }
  if (projectId) {
    await setDoc(doc(db, "projects", projectId), data)
    return projectId
  } else {
    const ref = await addDoc(collection(db, "projects"), data)
    return ref.id
  }
}

export async function loadProject(projectId) {
  const snap = await getDoc(doc(db, "projects", projectId))
  if (!snap.exists()) throw new Error("Project not found")
  return { id: snap.id, ...snap.data() }
}

export async function shareProject(projectId) {
  await updateDoc(doc(db, "projects", projectId), { isShared: true })
  return projectId
}

export async function loadSharedProject(projectId) {
  const snap = await getDoc(doc(db, "projects", projectId))
  if (!snap.exists()) throw new Error("Project not found")
  const data = snap.data()
  if (!data.isShared) throw new Error("This project is not shared")
  return { id: snap.id, ...data }
}

// ── User custom fixtures ───────────────────────────────────────────────────────
export async function getUserFixtures(userId) {
  const q = query(
    collection(db, "users", userId, "fixtures"),
    orderBy("createdAt", "desc")
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function saveUserFixture(userId, fixture) {
  const ref = await addDoc(collection(db, "users", userId, "fixtures"), {
    ...fixture,
    createdAt: new Date(),
  })
  return ref.id
}

export async function updateUserFixture(userId, fixtureId, fixture) {
  await updateDoc(doc(db, "users", userId, "fixtures", fixtureId), {
    ...fixture,
    updatedAt: new Date(),
  })
}

export async function deleteUserFixture(userId, fixtureId) {
  await deleteDoc(doc(db, "users", userId, "fixtures", fixtureId))
}

export async function listProjects(userId) {
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id:         d.id,
    name:       d.data().name ?? "Untitled Project",
    updatedAt:  d.data().updatedAt?.toDate?.() ?? null,
    floorCount: d.data().floorCount ?? null,
    roomCount:  d.data().roomCount  ?? null,
  }))
}

export async function deleteProject(projectId) {
  await deleteDoc(doc(db, "projects", projectId))
}

// ── User profile ───────────────────────────────────────────────────────────────
export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, "users", userId, "profile", "data"))
  return snap.exists() ? snap.data() : null
}

export async function updateUserProfile(userId, profileData) {
  await setDoc(doc(db, "users", userId, "profile", "data"), { ...profileData, updatedAt: new Date() }, { merge: true })
}

// ── Subscription ───────────────────────────────────────────────────────────────
// getUserSubscription kept for billing-history reads only — subscription
// status is now read from the root doc via AuthContext userDoc.
export async function getUserSubscription(userId) {
  const snap = await getDoc(doc(db, "users", userId))
  return snap.exists() ? (snap.data().subscription ?? null) : null
}

// Client-side fallback write — primary write is in api/verify-payment.js (server).
// Only touches the root doc; no subcollection.
export async function createSubscription(userId, plan, razorpayPaymentId) {
  const now      = new Date()
  const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  await setDoc(doc(db, "users", userId), {
    subscription: {
      status:            'active',
      plan,
      activatedAt:       now,
      renewsAt,
      razorpayPaymentId,
    },
  }, { merge: true })
}

export async function cancelSubscription(userId) {
  await setDoc(doc(db, "users", userId), {
    subscription: { status: 'cancelled', cancelledAt: new Date() },
  }, { merge: true })
}

export async function addBillingRecord(userId, { plan, amount, paymentId, description }) {
  await addDoc(collection(db, "users", userId, "billingHistory"), {
    date:        new Date(),
    plan,
    amount,
    paymentId,
    description: description ?? `${plan} subscription`,
    status:      "paid",
  })
}

export async function getBillingHistory(userId) {
  const q = query(
    collection(db, "users", userId, "billingHistory"),
    orderBy("date", "desc")
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Razorpay checkout ──────────────────────────────────────────────────────────
// Creates a Razorpay order via your backend/Cloud Function and returns checkout URL.
// Replace the endpoint below with your actual Cloud Function or backend URL.
export async function createCheckoutSession(userId, planId, email) {
  const endpoint = import.meta.env.VITE_RAZORPAY_CHECKOUT_ENDPOINT
  if (!endpoint) {
    // Fallback: open Razorpay inline (requires razorpay script loaded in index.html)
    return null
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, planId, email }),
  })
  if (!res.ok) throw new Error("Failed to create checkout session")
  const { checkoutUrl } = await res.json()
  return checkoutUrl
}

// ── Trial helpers ──────────────────────────────────────────────────────────────
const TRIAL_DAYS = 14

async function _getRootUserDoc(userId) {
  const snap = await getDoc(doc(db, "users", userId))
  return snap.exists() ? snap.data() : null
}

export async function isTrialActive(userId) {
  // Primary: read root user doc trialEndsAt (new schema)
  const rootDoc = await _getRootUserDoc(userId)
  if (rootDoc) {
    if (rootDoc.subscription?.status === 'active') return false
    if (rootDoc.trialEndsAt) {
      const end = rootDoc.trialEndsAt?.toDate?.() ?? new Date(rootDoc.trialEndsAt)
      return end > new Date()
    }
  }
  // Fallback: legacy profile/data.createdAt
  const profile = await getUserProfile(userId)
  if (!profile?.createdAt) return false
  const created = profile.createdAt?.toDate?.() ?? new Date(profile.createdAt)
  const elapsed = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  return elapsed < TRIAL_DAYS
}

export async function getTrialDaysRemaining(userId) {
  // Primary: read root user doc trialEndsAt
  const rootDoc = await _getRootUserDoc(userId)
  if (rootDoc) {
    if (rootDoc.subscription?.status === 'active') return null  // null = paid, no trial countdown
    if (rootDoc.trialEndsAt) {
      const end = rootDoc.trialEndsAt?.toDate?.() ?? new Date(rootDoc.trialEndsAt)
      return Math.max(0, Math.ceil((end - Date.now()) / 86400000))
    }
  }
  // Fallback: legacy profile/data.createdAt
  const profile = await getUserProfile(userId)
  if (!profile?.createdAt) return 0
  const created = profile.createdAt?.toDate?.() ?? new Date(profile.createdAt)
  const elapsed = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed))
}

// ── Project limit ──────────────────────────────────────────────────────────────
const PLAN_LIMITS   = { free: 3, trial: 10, pro: 10, professional: Infinity }
const AI_CALL_LIMITS = { pro: 50, professional: 200 }

// ── AI call tracking ──────────────────────────────────────────────────────────

// Returns { allowed: bool, used: number, limit: number }
export async function checkAiLimit(userId) {
  const rootDoc = await _getRootUserDoc(userId)
  const plan    = rootDoc?.subscription?.plan ?? 'free'
  const limit   = AI_CALL_LIMITS[plan] ?? 0
  if (limit === 0) return { allowed: false, used: 0, limit: 0 }

  // Reset counter if new calendar month
  const lastReset  = rootDoc?.aiUsage?.lastReset?.toDate?.() ?? new Date(0)
  const now        = new Date()
  const sameMonth  = lastReset.getFullYear() === now.getFullYear() &&
                     lastReset.getMonth()    === now.getMonth()

  if (!sameMonth) {
    await updateDoc(doc(db, 'users', userId), {
      'aiUsage.thisMonth': 0,
      'aiUsage.lastReset': serverTimestamp(),
    })
    return { allowed: true, used: 0, limit }
  }

  const used = rootDoc?.aiUsage?.thisMonth ?? 0
  return { allowed: used < limit, used, limit }
}

// Increment AI call counter (call after successful AI use)
export async function incrementAiCall(userId) {
  await updateDoc(doc(db, 'users', userId), {
    'aiUsage.thisMonth': increment(1),
    'aiUsage.totalCalls': increment(1),
  })
}

export async function checkProjectLimit(userId) {
  const [sub, projects, rootDoc] = await Promise.all([
    getUserSubscription(userId),
    listProjects(userId),
    _getRootUserDoc(userId),
  ])
  let plan = sub?.plan ?? "free"
  // Trial users (from root doc) get pro-level project limit
  if (rootDoc?.subscription?.status === 'trial') {
    const trialEndsAt = rootDoc.trialEndsAt?.toDate?.() ?? null
    if (trialEndsAt && trialEndsAt > new Date()) plan = 'trial'
  }
  const limit = PLAN_LIMITS[plan] ?? 3
  return projects.length < limit
}
