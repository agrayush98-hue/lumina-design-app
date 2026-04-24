import { useState } from "react"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "../firebase"

export default function AuthPage() {
  const [mode,     setMode]     = useState("login")   // "login" | "register"
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [confirm,  setConfirm]  = useState("")
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const isRegister = mode === "register"

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (isRegister && password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setError(error.message)
      }
    }
  }

  function friendlyError(code) {
    switch (code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential": return "Invalid email or password."
      case "auth/email-already-in-use":  return "An account with this email already exists."
      case "auth/invalid-email":         return "Please enter a valid email address."
      case "auth/too-many-requests":     return "Too many attempts. Please try again later."
      default: return "Authentication failed. Please try again."
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "#0d1520",
    border: "1px solid #1a2b3c",
    borderRadius: 4,
    color: "#cdd9e5",
    fontFamily: "IBM Plex Mono",
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#090c10",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "IBM Plex Mono",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 4,
          background: "linear-gradient(135deg, #1e4a6e 0%, #39c5cf 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#fff", fontWeight: 700, flexShrink: 0,
        }}>L</div>
        <span style={{ fontSize: 16, color: "#cdd9e5", letterSpacing: "0.15em" }}>LUMINA DESIGN</span>
      </div>

      {/* Card */}
      <div style={{
        width: 360,
        background: "#0d1520",
        border: "1px solid #1a2b3c",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
      }}>
        {/* Tab strip */}
        <div style={{ display: "flex", borderBottom: "1px solid #1a2b3c" }}>
          {["login", "register"].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              style={{
                flex: 1,
                padding: "12px 0",
                background: mode === m ? "#0a1018" : "transparent",
                border: "none",
                borderBottom: mode === m ? "2px solid #39c5cf" : "2px solid transparent",
                color: mode === m ? "#39c5cf" : "#2d4f68",
                fontFamily: "IBM Plex Mono",
                fontSize: 10,
                letterSpacing: "0.12em",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 24px 20px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 9, color: "#2d4f68", letterSpacing: "0.1em", marginBottom: 6 }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: isRegister ? 14 : 20 }}>
            <label style={{ display: "block", fontSize: 9, color: "#2d4f68", letterSpacing: "0.1em", marginBottom: 6 }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
              style={inputStyle}
            />
          </div>

          {isRegister && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 9, color: "#2d4f68", letterSpacing: "0.1em", marginBottom: 6 }}>
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: 16, padding: "8px 12px",
              background: "#1a0808", border: "1px solid #7f1d1d",
              borderRadius: 4, color: "#f87171",
              fontFamily: "IBM Plex Mono", fontSize: 10,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px 0",
              background: loading ? "#0e1d2e" : "#0e2a3a",
              border: "1px solid #39c5cf",
              borderRadius: 4,
              color: loading ? "#2d4f68" : "#39c5cf",
              fontFamily: "IBM Plex Mono",
              fontSize: 11,
              letterSpacing: "0.12em",
              cursor: loading ? "default" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>

          <div className="divider"><span>OR</span></div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="google-signin-btn"
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "white",
              color: "#444",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 16,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Sign in with Google
          </button>
        </form>
      </div>

      <div style={{ marginTop: 20, fontSize: 9, color: "#1a2b3c", letterSpacing: "0.08em" }}>
        LUMINA DESIGN · LIGHTING CALCULATION TOOL
      </div>
    </div>
  )
}
