import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, setDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, orderBy, query, where, Timestamp } from "firebase/firestore"
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
export const db   = getFirestore(app)
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
export async function getUserSubscription(userId) {
  const snap = await getDoc(doc(db, "users", userId, "subscription", "current"))
  return snap.exists() ? snap.data() : null
}

export async function createSubscription(userId, plan, razorpayPaymentId) {
  const now = new Date()
  const renewal = new Date(now)
  renewal.setMonth(renewal.getMonth() + 1)
  await setDoc(doc(db, "users", userId, "subscription", "current"), {
    plan,
    status: "active",
    razorpayPaymentId,
    startedAt: now,
    renewalDate: renewal,
    updatedAt: now,
  })
}

export async function cancelSubscription(userId) {
  await updateDoc(doc(db, "users", userId, "subscription", "current"), {
    status: "cancelled",
    cancelledAt: new Date(),
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

export async function isTrialActive(userId) {
  const profile = await getUserProfile(userId)
  if (!profile?.createdAt) return false
  const created = profile.createdAt?.toDate?.() ?? new Date(profile.createdAt)
  const elapsed = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  return elapsed < TRIAL_DAYS
}

export async function getTrialDaysRemaining(userId) {
  const profile = await getUserProfile(userId)
  if (!profile?.createdAt) return 0
  const created = profile.createdAt?.toDate?.() ?? new Date(profile.createdAt)
  const elapsed = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed))
}

// ── Project limit ──────────────────────────────────────────────────────────────
const PLAN_LIMITS = { free: 3, pro: 10, professional: Infinity }

export async function checkProjectLimit(userId) {
  const [sub, projects] = await Promise.all([
    getUserSubscription(userId),
    listProjects(userId),
  ])
  const plan  = sub?.plan ?? "free"
  const limit = PLAN_LIMITS[plan] ?? 3
  return projects.length < limit
}
