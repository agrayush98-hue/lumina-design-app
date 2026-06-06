jsx = open('design-reference/phase1-auth.html', encoding='utf-8').read()

# Write a minimal working AuthPage that loads the Stitch design via iframe-like approach
content = '''import { useState } from "react"
import { GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, sendEmailVerification, signOut } from "firebase/auth"
import { auth } from "../firebase"
import { useAuth } from "../contexts/AuthContext"

export default function AuthPage() {
  const { signup, login } = useAuth()
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  function friendlyError(code) {
    const map = {
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/email-already-in-use": "Email already registered.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/invalid-email": "Invalid email address.",
    }
    return map[code] || "Something went wrong. Please try again."
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(""); setInfo(""); setLoading(true)
    try {
      if (mode === "login") {
        const cred = await login(email, password)
        if (!cred.user.emailVerified) {
          await signOut(auth)
          setError("Please verify your email before logging in.")
        }
      } else {
        const cred = await signup(email, password)
        await sendEmailVerification(cred.user)
        await signOut(auth)
        setInfo("Verification email sent. Please verify before logging in.")
        setMode("login")
      }
    } catch (err) { setError(friendlyError(err.code)) }
    finally { setLoading(false) }
  }

  async function handleGoogle() {
    setError(""); setLoading(true)
    try { await signInWithPopup(auth, new GoogleAuthProvider()) }
    catch (err) { setError(friendlyError(err.code)) }
    finally { setLoading(false) }
  }

  async function handlePasswordReset(e) {
    e.preventDefault()
    setLoading(true)
    try { await sendPasswordResetEmail(auth, email); setResetSent(true) }
    catch (err) { setError(friendlyError(err.code)) }
    finally { setLoading(false) }
  }

  const S = {
    wrap: { display:"flex", height:"100vh", width:"100%", overflow:"hidden", background:"#131313", fontFamily:"Inter,sans-serif" },
    left: { flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"48px", background:"#0d0d0d", borderRight:"1px solid #222", backgroundImage:"radial-gradient(#222 1px,transparent 1px)", backgroundSize:"24px 24px" },
    brand: { fontSize:40, fontWeight:700, color:"#d4a843", letterSpacing:"0.04em", marginBottom:16 },
    tagline: { fontSize:16, color:"#888", marginBottom:48 },
    right: { flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:32, background:"#111", position:"relative" },
    card: { width:"100%", maxWidth:420, background:"#1a1a1a", border:"1px solid #222", padding:32 },
    tabs: { display:"flex", borderBottom:"1px solid #222", marginBottom:32 },
    tab: (active) => ({ flex:1, padding:"12px 0", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", border:"none", background:"none", cursor:"pointer", color:active?"#d4a843":"#888", borderBottom:2px solid  }),
    label: { display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#555", marginBottom:6 },
    input: { width:"100%", background:"#131313", border:"1px solid #222", color:"#e5e2e1", fontFamily:"IBM Plex Mono,monospace", fontSize:12, padding:"10px 12px", outline:"none", boxSizing:"border-box" },
    inputErr: { width:"100%", background:"#131313", border:"1px solid #ef4444", color:"#e5e2e1", fontFamily:"IBM Plex Mono,monospace", fontSize:12, padding:"10px 12px", outline:"none", boxSizing:"border-box" },
    btn: { width:"100%", background:"#d4a843", color:"#402d00", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"12px 0", border:"none", cursor:"pointer", marginTop:8 },
    or: { display:"flex", alignItems:"center", gap:16, padding:"24px 0" },
    orLine: { flex:1, height:1, background:"#222" },
    orText: { fontSize:11, letterSpacing:"0.1em", color:"#555" },
    googleBtn: { width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:12, background:"transparent", border:"1px solid #222", color:"#e5e2e1", padding:"10px 0", cursor:"pointer", fontSize:13 },
    err: { color:"#ef4444", fontSize:11, fontFamily:"monospace", marginBottom:12 },
    info: { color:"#4ade80", fontSize:11, fontFamily:"monospace", marginBottom:12 },
    overlay: { position:"absolute", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:16 },
    modal: { width:"100%", maxWidth:380, background:"#1a1a1a", border:"1px solid #222" },
    modalHead: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #222" },
    modalBody: { padding:16 },
    modalFoot: { display:"flex", justifyContent:"flex-end", gap:12, padding:"12px 16px", borderTop:"1px solid #222", background:"#1c1b1b" },
    ghostBtn: { background:"none", border:"none", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#555", cursor:"pointer" },
    goldBtn: { background:"#d4a843", color:"#402d00", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"8px 16px", border:"none", cursor:"pointer" },
    iconBtn: { background:"none", border:"none", color:"#888", cursor:"pointer", fontSize:20, lineHeight:1 },
  }

  return (
    <div style={S.wrap}>
      <div style={S.left}>
        <div style={S.brand}>LUMINA DESIGN</div>
        <div style={S.tagline}>Professional Lighting Design Platform</div>
        {[
          { icon:"calculate", title:"Lux Calculations", desc:"High-precision photometric simulations." },
          { icon:"settings_input_component", title:"DALI 2.0 Integration", desc:"Advanced control systems protocol mapping." },
          { icon:"picture_as_pdf", title:"Automated PDF Export", desc:"Generate compliance-ready technical documentation." },
        ].map(f => (
          <div key={f.icon} style={{ display:"flex", gap:16, marginBottom:24 }}>
            <span className="material-symbols-outlined" style={{ color:"#d4a843", flexShrink:0 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#e5e2e1", marginBottom:4 }}>{f.title}</div>
              <div style={{ fontSize:12, color:"#888" }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={S.right}>
        <div style={S.card}>
          <div style={S.tabs}>
            {["login","register"].map(m => (
              <button key={m} style={S.tab(mode===m)} onClick={() => { setMode(m); setError(""); setInfo(""); }}>
                {m==="login" ? "SIGN IN" : "REGISTER"}
              </button>
            ))}
          </div>
          {error && <div style={S.err}>{error}</div>}
          {info  && <div style={S.info}>{info}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={S.label}>Email Address</label>
              <input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="engineer@company.com" required />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:6 }}>
                <label style={{ ...S.label, marginBottom:0 }}>Password</label>
                {mode==="login" && <button type="button" onClick={() => { setMode("reset"); setError(""); }} style={{ fontSize:11, color:"#888", background:"none", border:"none", cursor:"pointer" }}>Forgot password?</button>}
              </div>
              <input style={error ? S.inputErr : S.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            </div>
            {mode==="register" && (
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Confirm Password</label>
                <input style={S.input} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
              </div>
            )}
            <button type="submit" style={S.btn} disabled={loading}>
              {loading ? "..." : mode==="login" ? "SIGN IN" : "CREATE ACCOUNT"}
            </button>
          </form>
          <div style={S.or}><div style={S.orLine}/><span style={S.orText}>OR</span><div style={S.orLine}/></div>
          <button style={S.googleBtn} onClick={handleGoogle} disabled={loading}>
            <span className="material-symbols-outlined" style={{ fontSize:20 }}>account_circle</span>
            Continue with Google
          </button>
        </div>

        {mode==="reset" && (
          <div style={S.overlay}>
            <div style={S.modal}>
              <div style={S.modalHead}>
                <span style={{ fontSize:13, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", color:"#e5e2e1" }}>Reset Password</span>
                <button style={S.iconBtn} onClick={() => { setMode("login"); setError(""); setResetSent(false); }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              {!resetSent ? (
                <>
                  <div style={S.modalBody}>
                    <p style={{ fontSize:12, color:"#888", marginBottom:12 }}>Enter your email to receive a password reset link.</p>
                    <label style={S.label}>Email Address</label>
                    <input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="engineer@company.com" />
                  </div>
                  <div style={S.modalFoot}>
                    <button style={S.ghostBtn} onClick={() => { setMode("login"); setError(""); }}>Cancel</button>
                    <button style={S.goldBtn} onClick={handlePasswordReset} disabled={loading}>Send Reset Link</button>
                  </div>
                </>
              ) : (
                <div style={{ padding:32, textAlign:"center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize:40, color:"#d4a843", display:"block", marginBottom:16 }}>mail</span>
                  <div style={{ fontSize:16, fontWeight:600, color:"#e5e2e1", marginBottom:8 }}>Reset link sent</div>
                  <div style={{ fontSize:12, color:"#888", marginBottom:24 }}>Check your inbox at <span style={{ fontFamily:"monospace", color:"#ccc" }}>{email}</span></div>
                  <button style={{ ...S.goldBtn, width:"100%", padding:"12px 0" }} onClick={() => { setMode("login"); setResetSent(false); }}>Back to Sign In</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'''

with open('src/components/AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Written:', len(content), 'chars')
