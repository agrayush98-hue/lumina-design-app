# Security Audit — Lumina Design

**Date:** 2026-05-05
**Severity:** CRITICAL (billing bypass)
**Status:** VULN-001 fixed (Firestore rules). VULN-002 fixed (verify-payment fallback).

---

## VULN-001 — Client-Side Subscription Write (CRITICAL)

### Location
`src/firebase.js` — `createSubscription()`

### Description
The `createSubscription` function runs entirely in the browser. It writes
`subscription.status: 'active'` and `subscription.plan: 'professional'` directly
to Firestore using the client SDK. Any authenticated user can call it from the
browser DevTools console with no payment:

```js
// Any user can run this in the browser console right now:
const { createSubscription } = await import('/src/firebase.js')
await createSubscription(firebase.auth().currentUser.uid, 'professional', 'fake')
// Result: free Professional plan, no payment taken
```

### Root Cause
This function was written as a fallback for when the server-side
`api/verify-payment.js` fails (e.g. missing `FIREBASE_SERVICE_ACCOUNT` env var).
The intent was correct but the fallback is dangerous.

### Fix Applied ✅
`firestore.rules` updated. The root `/users/{userId}` document now has a
split rule that blocks any update touching the `subscription` field:

```
allow update: if isOwner(userId) &&
                 !request.resource.data.diff(resource.data)
                    .affectedKeys()
                    .hasAny(['subscription']);
```

The Firebase Admin SDK (used in `api/verify-payment.js`) runs server-side and
bypasses Firestore security rules entirely — so the server write path is
unaffected. Client-side calls to `createSubscription()` will now be rejected
by Firestore with a permission-denied error.

**Remaining:** `createSubscription()` in `src/firebase.js` should still be
deleted once the rules are deployed and verified working in production.

---

## VULN-002 — Fallback Path in verify-payment.js (HIGH)

### Location
`api/verify-payment.js` — lines ~108-122

### Description
When Firebase Admin SDK fails to initialise, `verify-payment.js` returns:
```json
{ "success": true, "firestoreWritten": false, "adminError": "..." }
```
The client code interprets `success: true` as a completed payment and calls
the client-side `createSubscription()` fallback — which writes `subscription.status:
'active'` to Firestore with **no HMAC signature verification**.

This means: if `FIREBASE_SERVICE_ACCOUNT` is ever missing from Vercel (e.g.
after a secret rotation, a new deployment environment, or an accidental delete),
the HMAC check becomes irrelevant. Any user who initiates a Razorpay checkout
(even an abandoned one that never completes) could potentially trigger the fallback.

### Fix Applied ✅
Both fallback paths in `api/verify-payment.js` now return HTTP 500 with
`success: false`. The client-side `createSubscription()` fallback is never
triggered. Two catch blocks were fixed:
- Admin SDK init failure (was line ~129)
- Firestore write failure (was line ~167)

The HMAC signature check (line ~115) was already returning HTTP 400 correctly —
that path was never vulnerable.

---

## VULN-003 — Client-Side AI Rate Limit Check (MEDIUM)

### Location
`src/firebase.js` — `checkAiLimit()`
`src/App.jsx` — `openAiTab()`

### Description
AI call limits are enforced by reading `aiUsage.thisMonth` from Firestore
on the client. A user can:
1. Open DevTools → Firestore emulator or direct SDK call
2. Set `aiUsage.thisMonth = 0`
3. Get unlimited AI calls

### Fix Required
Move `checkAiLimit` to a server-side Cloud Function or Vercel serverless
function that runs before proxying the AI request. The AI call should only
be forwarded after server-side verification of the counter.

---

## VULN-004 — CORS Wildcard on API Endpoints (LOW)

### Location
`api/verify-payment.js` line 63
`api/create-checkout.js` line 11

### Description
Both endpoints set `Access-Control-Allow-Origin: '*'`. This is not directly
exploitable (POST requests with JSON bodies require preflight, and the
HMAC check protects verify-payment), but it is unnecessarily permissive.

### Fix Required
Restrict to your production domain:
```js
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com')
```

---

## Priority Order

| # | Vulnerability | Effort | Must fix before |
|---|---------------|--------|-----------------|
| 1 | VULN-001: Client-side subscription write | 2hr (Firestore rules) | Scaling paid acquisition |
| 2 | VULN-002: verify-payment fallback path | 30min (change HTTP 200→500) | Any paid traffic |
| 3 | VULN-003: Client-side AI limit | 4hr (serverless proxy) | Pro tier launch |
| 4 | VULN-004: CORS wildcard | 15min | Before Series A due diligence |

---

## What is Already Correct

- ✅ Razorpay HMAC signature verification in `api/verify-payment.js`
- ✅ Firestore write uses Firebase Admin SDK (server-side) in the happy path
- ✅ `RAZORPAY_KEY_SECRET` is server-only (never exposed to client)
- ✅ Firebase config uses `VITE_` env vars (public keys only — this is correct for Firebase)
- ✅ `api/create-checkout.js` validates plan ID against a whitelist before creating order
