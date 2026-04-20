import { useState, useEffect } from "react"
import { useNavigate }         from "react-router-dom"
import { onAuthStateChanged }  from "firebase/auth"
import { auth }                from "../firebase"
import Dashboard               from "./Dashboard"
import AuthPage                from "./AuthPage"

export default function DashboardRoute() {
  const navigate   = useNavigate()
  const [user,     setUser]    = useState(undefined)
  const [loading,  setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u ?? null)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a1018", fontFamily: "IBM Plex Mono", fontSize: 12, color: "#4a7a96", letterSpacing: "0.1em" }}>
      Authenticating…
    </div>
  )

  if (!user) return <AuthPage />

  return <Dashboard user={user} />
}
