import { useState } from "react"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
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
        background: "#0d1117",
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
        </form>
      </div>

      <div style={{ marginTop: 20, fontSize: 9, color: "#1a2b3c", letterSpacing: "0.08em" }}>
        LUMINA DESIGN · LIGHTING CALCULATION TOOL
      </div>
    </div>
  )
}
