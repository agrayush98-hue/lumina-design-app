import { useState, useEffect } from "react"
import { useNavigate }         from "react-router-dom"
import { signOut, updateProfile } from "firebase/auth"
import { auth }                from "../firebase"
import {
  listProjects, loadProject, deleteProject, saveProject,
  getUserProfile, updateUserProfile,
  getUserSubscription, getBillingHistory,
  cancelSubscription,
  isTrialActive, getTrialDaysRemaining, checkProjectLimit,
} from "../firebase"
import NewProjectWizard        from "./NewProjectWizard"
import { PROJECT_TEMPLATES }   from "../templates/projectTemplates"
import "./Dashboard.css"

const TABS = [
  { id: "projects",     label: "Projects",     icon: "◫" },
  { id: "profile",      label: "Profile",      icon: "◉" },
  { id: "settings",     label: "Settings",     icon: "⚙" },
  { id: "subscription", label: "Subscription", icon: "◈" },
]

const PLANS = [
  {
    id: "pro",
    name: "PRO",
    price: "₹1,179",
    period: "/month",
    features: [
      { text: "Up to 10 projects",          highlight: true },
      { text: "All fixture library",         highlight: true },
      { text: "PDF export",                  highlight: true },
      { text: "Floor plan upload",           highlight: true },
      { text: "Email support",               highlight: false },
      { text: "Priority support",            highlight: false },
      { text: "Team collaboration",          highlight: false },
    ],
    razorpayPlan: "plan_pro_monthly",
  },
  {
    id: "professional",
    name: "PROFESSIONAL",
    price: "₹2,949",
    period: "/month",
    features: [
      { text: "Unlimited projects",          highlight: true },
      { text: "All fixture library",         highlight: true },
      { text: "PDF export",                  highlight: true },
      { text: "Floor plan upload",           highlight: true },
      { text: "Priority support",            highlight: true },
      { text: "Team collaboration",          highlight: true },
      { text: "Custom fixture library",      highlight: true },
    ],
    razorpayPlan: "plan_professional_monthly",
  },
]

function fmt(date) {
  if (!date) return "—"
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    + " " + date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const CARD_COLORS = ["#39c5cf", "#d4a843", "#ff7c00", "#4da6ff", "#cc60ff", "#20c0f0"]

function cardColor(name = "") {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return CARD_COLORS[Math.abs(h) % CARD_COLORS.length]
}

function timeAgo(date) {
  if (!date) return "—"
  const diff = Date.now() - date.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)   return "just now"
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 30)  return `${days}d ago`
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
}

// ── Projects tab ──────────────────────────────────────────────────────────────

function ProjectsTab({ user }) {
  const navigate     = useNavigate()
  const [projects,   setProjects]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    setLoading(true); setError(null)
    try { setProjects(await listProjects(user.uid)) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function handleOpen(proj) { navigate(`/app?projectId=${proj.id}`) }

  async function handleDelete(e, projId) {
    e.stopPropagation()
    if (!window.confirm("Delete this project? This cannot be undone.")) return
    setDeletingId(projId)
    try {
      await deleteProject(projId)
      setProjects(prev => prev.filter(p => p.id !== projId))
    } catch (err) {
      setError(`Delete failed: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleNewProject() {
    try {
      const canCreate = await checkProjectLimit(user.uid)
      if (!canCreate) {
        setError("Project limit reached for your plan. Upgrade to create more projects.")
        return
      }
      setShowWizard(true)
    } catch (e) {
      setError(e.message)
    }
  }

  // Stats
  const totalRooms    = projects.reduce((s, p) => s + (p.roomCount  ?? 0), 0)
  const totalFloors   = projects.reduce((s, p) => s + (p.floorCount ?? 0), 0)
  const lastUpdated   = projects.reduce((latest, p) => {
    const t = p.updatedAt?.getTime?.() ?? 0
    return t > latest ? t : latest
  }, 0)

  return (
    <>
      {/* Stats bar */}
      {!loading && projects.length > 0 && (
        <div className="dash-stats-bar">
          <div className="dash-stat">
            <div className="dash-stat-value">{projects.length}</div>
            <div className="dash-stat-label">Projects</div>
          </div>
          <div className="dash-stat-divider" />
          <div className="dash-stat">
            <div className="dash-stat-value">{totalFloors}</div>
            <div className="dash-stat-label">Floors</div>
          </div>
          <div className="dash-stat-divider" />
          <div className="dash-stat">
            <div className="dash-stat-value">{totalRooms}</div>
            <div className="dash-stat-label">Rooms</div>
          </div>
          <div className="dash-stat-divider" />
          <div className="dash-stat">
            <div className="dash-stat-value">{lastUpdated ? timeAgo(new Date(lastUpdated)) : "—"}</div>
            <div className="dash-stat-label">Last active</div>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn-primary" onClick={handleNewProject}>+ NEW PROJECT</button>
        </div>
      )}

      {/* Section header (no projects state hides stats bar) */}
      {(loading || projects.length === 0) && (
        <div className="dash-section-header">
          <div>
            <div className="dash-section-title">PROJECTS</div>
            {!loading && <div className="dash-section-sub">No projects yet</div>}
          </div>
          {!loading && <button className="btn-primary" onClick={handleNewProject}>+ NEW PROJECT</button>}
        </div>
      )}

      {error && <div className="inline-error">{error}</div>}
      {loading && <div className="loading-state">Loading projects…</div>}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="empty-state-enhanced">
          <div className="empty-state-icon">◫</div>
          <div className="empty-state-title">Start your first project</div>
          <div className="empty-state-desc">Choose a template or start from scratch</div>
          <div className="empty-quickstart">
            {PROJECT_TEMPLATES.map(tpl => (
              <button key={tpl.id} className="empty-tpl-btn" onClick={() => {
                try { sessionStorage.setItem("lumina_pending_template", JSON.stringify(tpl)) } catch {}
                navigate(`/app?new=${encodeURIComponent(tpl.name)}`)
              }}>
                <span style={{ color: tpl.accentColor }}>{tpl.icon}</span>
                <span>{tpl.name}</span>
              </button>
            ))}
            <button className="empty-tpl-btn empty-tpl-blank" onClick={handleNewProject}>
              <span style={{ color: "#555" }}>◻</span>
              <span>Blank Canvas</span>
            </button>
          </div>
        </div>
      )}

      {/* Project grid */}
      {!loading && projects.length > 0 && (
        <div className="projects-grid">
          {projects.map(proj => {
            const color = cardColor(proj.name)
            return (
              <div key={proj.id} className="project-card" onClick={() => handleOpen(proj)}>
                <div className="project-card-header" style={{ background: `${color}14`, borderBottom: `1px solid ${color}30` }}>
                  <div className="project-card-initial" style={{ color, border: `1px solid ${color}50` }}>
                    {(proj.name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="project-card-badge">
                    {proj.roomCount > 0 ? "ACTIVE" : "EMPTY"}
                  </div>
                </div>
                <div className="project-card-body">
                  <div className="project-card-name">{proj.name}</div>
                  <div className="project-card-meta">
                    {proj.floorCount != null && <span>{proj.floorCount} floor{proj.floorCount !== 1 ? "s" : ""}</span>}
                    {proj.roomCount  != null && <span>{proj.roomCount} room{proj.roomCount !== 1 ? "s" : ""}</span>}
                    {proj.updatedAt  && <span style={{ marginLeft: "auto" }}>{timeAgo(proj.updatedAt)}</span>}
                  </div>
                </div>
                <div className="project-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-secondary" style={{ fontSize: 9, padding: "5px 12px", flex: 1 }} onClick={() => handleOpen(proj)}>
                    OPEN →
                  </button>
                  <button
                    className="btn-danger"
                    style={{ fontSize: 9, padding: "5px 10px" }}
                    disabled={deletingId === proj.id}
                    onClick={e => handleDelete(e, proj.id)}
                  >
                    {deletingId === proj.id ? "…" : "✕"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Template quick-start (when user has projects) */}
      {!loading && projects.length > 0 && (
        <div className="dash-template-section">
          <div className="dash-template-header">
            <div className="dash-template-title">QUICK START FROM TEMPLATE</div>
          </div>
          <div className="dash-template-row">
            {PROJECT_TEMPLATES.map(tpl => (
              <button key={tpl.id} className="dash-tpl-pill" onClick={() => {
                try { sessionStorage.setItem("lumina_pending_template", JSON.stringify(tpl)) } catch {}
                navigate(`/app?new=${encodeURIComponent(tpl.name)}`)
              }}>
                <span style={{ color: tpl.accentColor }}>{tpl.icon}</span>
                <span>{tpl.name}</span>
                <span className="dash-tpl-cat" style={{ color: tpl.accentColor }}>{tpl.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showWizard && <NewProjectWizard onClose={() => setShowWizard(false)} />}
    </>
  )
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({ user }) {
  const [displayName, setDisplayName] = useState(user.displayName ?? "")
  const [org,         setOrg]         = useState("")
  const [saving,      setSaving]      = useState(false)
  const [msg,         setMsg]         = useState(null)

  useEffect(() => {
    getUserProfile(user.uid).then(p => {
      if (p?.org)         setOrg(p.org)
      if (p?.displayName) setDisplayName(p.displayName)
    }).catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true); setMsg(null)
    try {
      await updateUserProfile(user.uid, { displayName: displayName.trim(), org: org.trim() })
      await updateProfile(user, { displayName: displayName.trim() })
      setMsg({ type: "success", text: "Profile saved." })
    } catch (e) {
      setMsg({ type: "error", text: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="dash-section-header">
        <div className="dash-section-title">PROFILE</div>
      </div>
      <div className="form-section">
        <div className="form-group">
          <label className="form-label">Display Name</label>
          <input className="form-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={user.email ?? ""} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Organization</label>
          <input className="form-input" value={org} onChange={e => setOrg(e.target.value)} placeholder="Company or firm name" />
        </div>
        {msg && <div className={msg.type === "success" ? "inline-success" : "inline-error"}>{msg.text}</div>}
        <div className="form-actions">
          <button className="btn-primary" disabled={saving} onClick={handleSave}>{saving ? "SAVING…" : "SAVE CHANGES"}</button>
        </div>
      </div>
    </>
  )
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab({ user }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(true)
  const [twoFA,         setTwoFA]         = useState(false)
  const [darkTheme,     setDarkTheme]     = useState(true)
  const [deleting,      setDeleting]      = useState(false)

  async function handleDeleteAccount() {
    if (!window.confirm("Permanently delete your account and all projects? This cannot be undone.")) return
    setDeleting(true)
    try {
      await user.delete()
      navigate("/")
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
      setDeleting(false)
    }
  }

  const toggles = [
    {
      id: "notifications", label: "Email Notifications",
      desc: "Receive updates about your projects and account",
      value: notifications, set: setNotifications,
    },
    {
      id: "twofa", label: "Two-Factor Authentication",
      desc: "Extra layer of security on sign in",
      value: twoFA, set: setTwoFA,
    },
    {
      id: "darkTheme", label: "Dark Theme",
      desc: "Always use dark interface (current default)",
      value: darkTheme, set: setDarkTheme,
    },
  ]

  return (
    <>
      <div className="dash-section-header">
        <div className="dash-section-title">SETTINGS</div>
      </div>
      <div style={{ maxWidth: 480 }}>
        <div className="toggle-list">
          {toggles.map(t => (
            <div key={t.id} className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-label">{t.label}</div>
                <div className="toggle-desc">{t.desc}</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={t.value} onChange={e => t.set(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>

        <hr className="form-divider" style={{ margin: "24px 0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="form-label" style={{ marginBottom: 8 }}>DANGER ZONE</div>
          <button className="btn-danger" style={{ alignSelf: "flex-start" }} disabled={deleting} onClick={handleDeleteAccount}>
            {deleting ? "DELETING…" : "DELETE ACCOUNT"}
          </button>
          <div style={{ fontSize: 9, color: "#4a7a96", letterSpacing: "0.04em" }}>
            Permanently deletes your account and all associated data.
          </div>
        </div>
      </div>
    </>
  )
}

// ── Subscription tab ──────────────────────────────────────────────────────────

function SubscriptionTab({ user }) {
  const [sub,         setSub]         = useState(null)
  const [billing,     setBilling]     = useState([])
  const [trialActive, setTrialActive] = useState(false)
  const [trialDays,   setTrialDays]   = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [paying,      setPaying]      = useState(null)
  const [cancelling,  setCancelling]  = useState(false)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    Promise.all([
      getUserSubscription(user.uid),
      getBillingHistory(user.uid),
      isTrialActive(user.uid),
      getTrialDaysRemaining(user.uid),
    ]).then(([s, b, trial, days]) => {
      setSub(s)
      setBilling(b)
      setTrialActive(trial)
      setTrialDays(days)
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpgrade(plan) {
    setPaying(plan.id)
    setError(null)
    try {
      // Step 1: create Razorpay order via Vercel serverless function
      const res = await fetch("/api/create-checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: user.uid, plan: plan.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Checkout failed")

      // Step 2: open Razorpay inline payment modal
      const rzp = new window.Razorpay({
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency ?? "INR",
        order_id:    data.orderId,
        name:        "Lumina Design",
        description: plan.name,
        prefill:     { email: user.email ?? "" },
        theme:       { color: "#39c5cf" },
        handler: async function (response) {
          // Step 3: verify payment and activate subscription
          try {
            const vRes = await fetch("/api/verify-payment", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                userId:              user.uid,
              }),
            })
            const vData = await vRes.json()
            if (!vRes.ok) throw new Error(vData.error ?? "Verification failed")
            // Reload subscription state
            const updated = await getUserSubscription(user.uid)
            setSub(updated)
          } catch (e) {
            setError(`Payment verified but activation failed: ${e.message}`)
          }
        },
        modal: { ondismiss: () => setPaying(null) },
      })
      rzp.open()
    } catch (e) {
      setError(e.message)
      setPaying(null)
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel your subscription? You'll keep access until the billing period ends.")) return
    setCancelling(true)
    try {
      await cancelSubscription(user.uid)
      setSub(prev => prev ? { ...prev, status: "cancelled" } : prev)
    } catch (e) {
      setError(e.message)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className="loading-state">Loading subscription…</div>

  const currentPlanId = sub?.plan ?? null

  return (
    <>
      <div className="dash-section-header">
        <div className="dash-section-title">SUBSCRIPTION</div>
      </div>

      {error && <div className="inline-error">{error}</div>}

      {/* Trial banner */}
      {trialActive && (
        <div className="trial-banner">
          <div className="trial-text">◈ FREE TRIAL ACTIVE</div>
          <div className="trial-days">{trialDays} day{trialDays !== 1 ? "s" : ""} remaining</div>
        </div>
      )}

      {/* Current plan */}
      {sub && (
        <div className="current-plan-banner">
          <div>
            <div className="plan-badge">
              <span className="plan-badge-dot" />
              {(sub.plan ?? "FREE").toUpperCase()}
            </div>
            {sub.renewalDate && (
              <div className="plan-renewal" style={{ marginTop: 6 }}>
                Renews {fmt(sub.renewalDate?.toDate?.() ?? sub.renewalDate)}
              </div>
            )}
            {sub.status === "cancelled" && (
              <div className="plan-renewal" style={{ color: "#d94f4f", marginTop: 6 }}>Cancelled — access until period end</div>
            )}
          </div>
          {currentPlanId && sub.status !== "cancelled" && (
            <button className="btn-danger" style={{ fontSize: 9 }} disabled={cancelling} onClick={handleCancel}>
              {cancelling ? "CANCELLING…" : "CANCEL PLAN"}
            </button>
          )}
        </div>
      )}

      {/* Plan cards */}
      <div className="plans-grid">
        {PLANS.map(plan => {
          const isCurrent = currentPlanId === plan.id
          return (
            <div key={plan.id} className={`plan-card${isCurrent ? " current" : ""}`}>
              <div className="plan-card-name">{plan.name}</div>
              <div className="plan-card-price">
                <span className="plan-price-amount">{plan.price}</span>
                <span className="plan-price-period">{plan.period}</span>
              </div>
              <ul className="plan-features">
                {plan.features.map((f, i) => (
                  <li key={i} className={f.highlight ? "highlight" : ""}>{f.text}</li>
                ))}
              </ul>
              {isCurrent ? (
                <button className="btn-secondary" disabled style={{ fontSize: 9 }}>CURRENT PLAN</button>
              ) : (
                <button
                  className="btn-primary"
                  style={{ fontSize: 9 }}
                  disabled={paying === plan.id}
                  onClick={() => handleUpgrade(plan)}
                >
                  {paying === plan.id ? "REDIRECTING…" : "UPGRADE"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Billing history */}
      <div className="billing-section">
        <div className="billing-title">BILLING HISTORY</div>
        {billing.length === 0 ? (
          <div className="billing-empty">No payment records yet.</div>
        ) : (
          <table className="billing-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>DESCRIPTION</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {billing.map((b, i) => (
                <tr key={i}>
                  <td>{fmt(b.date?.toDate?.() ?? b.date)}</td>
                  <td>{b.description ?? "Subscription payment"}</td>
                  <td>₹{b.amount}</td>
                  <td style={{ color: b.status === "paid" ? "#39c5cf" : "#d94f4f" }}>
                    {(b.status ?? "—").toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

// ── Dashboard root ────────────────────────────────────────────────────────────

export default function Dashboard({ user }) {
  const navigate   = useNavigate()
  const [tab, setTab] = useState("projects")

  async function handleSignOut() {
    await signOut(auth)
    navigate("/")
  }

  return (
    <div className="dash-root">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-logo">
          <span className="dash-logo-lumina">LUMINA</span>
          <span className="dash-logo-design">DESIGN</span>
        </div>
        <div className="dash-header-right">
          <span className="dash-user-email">{user.email}</span>
          <button className="btn-signout" onClick={handleSignOut}>SIGN OUT</button>
        </div>
      </header>

      {/* Body */}
      <div className="dash-body">
        {/* Sidebar */}
        <nav className="dash-sidebar">
          <div className="dash-sidebar-label">Navigation</div>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`dash-tab-btn${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="dash-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="dash-content">
          {tab === "projects"     && <ProjectsTab     user={user} />}
          {tab === "profile"      && <ProfileTab      user={user} />}
          {tab === "settings"     && <SettingsTab      user={user} />}
          {tab === "subscription" && <SubscriptionTab user={user} />}
        </main>
      </div>
    </div>
  )
}
