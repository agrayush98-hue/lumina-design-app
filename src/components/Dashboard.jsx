import { useState, useEffect } from "react"
import { Shield, Lock, RefreshCw, BadgeCheck, CreditCard } from 'lucide-react'
import { useNavigate, useLocation } from "react-router-dom"
import { signOut, updateProfile, reauthenticateWithPopup, reauthenticateWithCredential, EmailAuthProvider, GoogleAuthProvider, deleteUser } from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { auth, db }       from "../firebase"
import { useToast }        from "./Toast"
import { useAuth }         from "../contexts/AuthContext"
import {
  listProjects, loadProject, deleteProject, saveProject,
  getUserProfile, updateUserProfile,
  getBillingHistory,
  cancelSubscription, createSubscription, addBillingRecord,
  checkProjectLimit,
} from "../firebase"
import NewProjectWizard        from "./NewProjectWizard"
import { PROJECT_TEMPLATES }   from "../templates/projectTemplates"
import { emailPaymentSuccess, emailSubscriptionCancelled } from "../emails/templates"
import { useConfirm }          from "./ConfirmModal"
import "./Dashboard.css"

async function sendEmail(to, subject, html) {
  try {
    await fetch('/api/send-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ to, subject, html }),
    })
  } catch (err) {
    console.warn('[Dashboard] email send failed:', err)
  }
}

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
      { text: "10 projects",                      highlight: true },
      { text: "5 rooms per project",              highlight: true },
      { text: "50 AI calls / month",              highlight: true },
      { text: "PDF + Excel export",               highlight: true },
      { text: "Floor plan upload",                highlight: true },
      { text: "DALI 2.0 planning",               highlight: true },
      { text: "Heatmap + beam analysis",         highlight: true },
      { text: "All standard fixtures",            highlight: true },
      { text: "Email support",                    highlight: false },
    ],
    amountPaise: 117900,
  },
  {
    id: "professional",
    name: "PROFESSIONAL",
    price: "₹2,949",
    period: "/month",
    features: [
      { text: "Unlimited projects & rooms",             highlight: true },
      { text: "200 AI calls / month",                   highlight: true },
      { text: "PDF + Excel export",                     highlight: true },
      { text: "Floor plan upload",                      highlight: true },
      { text: "DALI 2.0 planning",                      highlight: true },
      { text: "Branded fixtures (Philips/Havells/Wipro)", highlight: true },
      { text: "Branded client reports",                 highlight: true },
      { text: "Project folders",                        highlight: true },
      { text: "Priority email support",                 highlight: true },
    ],
    amountPaise: 294900,
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

function TemplateCards({ onNewProject, navigate }) {
  return (
    <div className="tpl-cards-row">
      {PROJECT_TEMPLATES.map(tpl => {
        const tplLux   = tpl.floors?.[0]?.rooms?.[0]?.room?.targetLux ?? null
        const tplCount = tpl.floors?.[0]?.rooms?.[0]?.lights?.length ?? null
        return (
          <button key={tpl.id} className="tpl-card-btn" onClick={() => {
            try { sessionStorage.setItem("lumina_pending_template", JSON.stringify(tpl)) } catch {}
            navigate(`/app?new=${encodeURIComponent(tpl.name)}`)
          }}>
            <span className="tpl-card-icon" style={{ color: tpl.accentColor }}>{tpl.icon}</span>
            <span className="tpl-card-name">{tpl.name}</span>
            <span className="tpl-card-cat" style={{ color: tpl.accentColor }}>{tpl.category}</span>
            {(tplLux != null || tplCount != null) && (
              <span className="tpl-card-meta">
                {tplLux != null && <span>{tplLux} lux</span>}
                {tplCount != null && <span>{tplCount} fixtures</span>}
              </span>
            )}
          </button>
        )
      })}
      <button className="tpl-card-btn tpl-card-blank" onClick={onNewProject}>
        <span className="tpl-card-icon" style={{ color: "#444" }}>+</span>
        <span className="tpl-card-name">Blank Canvas</span>
        <span className="tpl-card-cat" style={{ color: "#444" }}>CUSTOM</span>
        <span className="tpl-card-meta"><span>Any lux</span><span>0 fixtures</span></span>
      </button>
    </div>
  )
}

function ProjectsTab({ user }) {
  const navigate     = useNavigate()
  const toast        = useToast()
  const confirm      = useConfirm()
  const { userDoc }  = useAuth()
  const [projects,   setProjects]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [showWizard, setShowWizard] = useState(false)
  const [trialDays,  setTrialDays]  = useState(null)

  const sub        = userDoc?.subscription
  const isPro      = sub?.status === 'active' && sub?.plan === 'pro'
  const isProfessional = sub?.status === 'active' && sub?.plan === 'professional'
  const isPaid     = isPro || isProfessional
  const projectLimit = isProfessional ? Infinity : isPro ? 10 : 3
  const aiLimit      = isProfessional ? 200 : isPro ? 50 : 0
  const aiUsed       = userDoc?.aiUsage?.thisMonth ?? 0

  useEffect(() => {
    fetchProjects()
    // Compute unclamped days so negative values indicate expired trial
    getUserProfile(user.uid).then(profile => {
      if (!profile?.createdAt) { setTrialDays(-1); return }
      const created = profile.createdAt?.toDate?.() ?? new Date(profile.createdAt)
      const remaining = Math.ceil(14 - (Date.now() - created.getTime()) / 86400000)
      setTrialDays(remaining)
    }).catch(() => setTrialDays(-1))
  }, [])

  async function fetchProjects() {
    setLoading(true); setError(null)
    try { setProjects(await listProjects(user.uid)) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function handleOpen(proj) { navigate(`/app?projectId=${proj.id}`) }

  async function handleDelete(e, projId) {
    e.stopPropagation()
    const ok = await confirm("Delete this project? This cannot be undone.", {
      title: "DELETE PROJECT",
      confirmLabel: "DELETE",
      danger: true,
    })
    if (!ok) return
    setDeletingId(projId)
    try {
      await deleteProject(projId)
      setProjects(prev => prev.filter(p => p.id !== projId))
      toast.success("Project deleted.")
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`)
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

  // Derived stats
  const totalRooms   = projects.reduce((s, p) => s + (p.roomCount  ?? 0), 0)
  const totalLights  = projects.reduce((s, p) => s + (p.lightCount ?? 0), 0)
  const totalWatts   = projects.reduce((s, p) => s + (p.totalWatts ?? 0), 0)

  const sorted       = [...projects].sort((a, b) => (b.updatedAt?.getTime?.() ?? 0) - (a.updatedAt?.getTime?.() ?? 0))
  const lastProject  = sorted[0] ?? null
  const recentThree  = sorted.slice(0, 3)

  // Last stat: plan status (paid) or trial countdown
  let planStatValue, planStatLabel, planStatColor
  if (isPro) {
    planStatValue = "PRO"
    planStatLabel = "PLAN ACTIVE"
    planStatColor = "#d4a843"
  } else if (isProfessional) {
    planStatValue = "PRO+"
    planStatLabel = "PLAN ACTIVE"
    planStatColor = "#d4a843"
  } else if (trialDays != null && trialDays > 0) {
    planStatValue = Math.max(0, trialDays)
    planStatLabel = "TRIAL DAYS LEFT"
    planStatColor = "#d4a843"
  } else {
    planStatValue = "0"
    planStatLabel = "TRIAL EXPIRED"
    planStatColor = "#ef4444"
  }

  return (
    <>
      {/* Stats bar — pinned above scroll area, never clips */}
      <div className="dash-stats-bar">
        {loading ? (
          <div className="dash-stat-loading">Loading…</div>
        ) : (
          <>
            <div className="dash-stat">
              <div className="dash-stat-value">{projects.length}</div>
              <div className="dash-stat-label">Total Projects</div>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <div className="dash-stat-value">{totalRooms || "—"}</div>
              <div className="dash-stat-label">Rooms Designed</div>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <div className="dash-stat-value" style={{ color: "#d4a843" }}>{totalLights || "—"}</div>
              <div className="dash-stat-label">Fixtures Placed</div>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <div className="dash-stat-value">{totalWatts ? `${totalWatts}W` : "—"}</div>
              <div className="dash-stat-label">Total Load</div>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <div className="dash-stat-value" style={{ color: planStatColor }}>{planStatValue}</div>
              <div className="dash-stat-label">{planStatLabel}</div>
            </div>
            <div style={{ flex: 1 }} />
            <button className="btn-primary" onClick={handleNewProject}>+ NEW PROJECT</button>
          </>
        )}
      </div>

      {/* Scrollable body — two independent columns */}
      <div className="dash-body-scroll">
        {error && <div className="inline-error" style={{ padding: "0 0 12px" }}>{error}</div>}
        {loading && <div className="loading-state">Loading projects…</div>}

        {!loading && (
          <div className="dash-main-layout">

            {/* ── Center column ── */}
            <div className="dash-projects-col">

              {/* Continue where you left off */}
              {lastProject && (
                <div className="dash-continue-banner">
                  <div className="dash-continue-left">
                    <div className="dash-continue-label">CONTINUE WHERE YOU LEFT OFF</div>
                    <div className="dash-continue-name">{lastProject.name}</div>
                    <div className="dash-continue-meta">
                      {lastProject.roomCount != null && <span>{lastProject.roomCount} room{lastProject.roomCount !== 1 ? "s" : ""}</span>}
                      {lastProject.floorCount != null && <span>{lastProject.floorCount} floor{lastProject.floorCount !== 1 ? "s" : ""}</span>}
                      <span>Last edited {timeAgo(lastProject.updatedAt)}</span>
                    </div>
                  </div>
                  <button className="btn-continue" onClick={() => handleOpen(lastProject)}>
                    Continue →
                  </button>
                </div>
              )}

              {/* Project grid */}
              {projects.length > 0 && (
                <>
                  <div className="dash-section-header">
                    <div className="dash-section-title">ALL PROJECTS</div>
                    <button className="btn-secondary" style={{ fontSize: 9, padding: "5px 12px" }} onClick={handleNewProject}>+ NEW</button>
                  </div>
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
                </>
              )}

              {/* Templates — single section */}
              <div className="dash-template-section">
                <div className="dash-template-header">
                  <div className="dash-template-title">START FROM TEMPLATE</div>
                </div>
                <TemplateCards onNewProject={handleNewProject} navigate={navigate} />
              </div>

              {/* Recent Projects */}
              <div className="dash-template-section">
                <div className="dash-template-header">
                  <div className="dash-template-title">RECENT PROJECTS</div>
                </div>
                {recentThree.length === 0 ? (
                  <div className="dash-recent-empty-state">
                    <div className="dash-recent-empty-text">No recent projects yet.</div>
                    <button className="dash-recent-create-link" onClick={handleNewProject}>
                      + Create your first project
                    </button>
                  </div>
                ) : (
                  <div className="dash-recent-row">
                    {recentThree.map(proj => {
                      const color = cardColor(proj.name)
                      return (
                        <div key={proj.id} className="dash-recent-card" onClick={() => handleOpen(proj)}>
                          <div className="dash-recent-dot" style={{ background: color }} />
                          <div className="dash-recent-info">
                            <div className="dash-recent-name">{proj.name}</div>
                            <div className="dash-recent-meta">
                              {proj.roomCount != null && <span>{proj.roomCount} rooms</span>}
                              {proj.lightCount != null && proj.lightCount > 0 && <span>{proj.lightCount} fixtures</span>}
                            </div>
                            <div className="dash-recent-time">{timeAgo(proj.updatedAt)}</div>
                          </div>
                          <div className="dash-recent-arrow">→</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Getting Started */}
              <div className="dash-template-section">
                <div className="dash-template-header">
                  <div className="dash-template-title">GETTING STARTED</div>
                </div>
                <div className="dash-steps-list">
                  {[
                    { n: 1, title: "Choose a template", desc: "Pick a room type above to start with pre-configured fixtures and lux targets" },
                    { n: 2, title: "Place fixtures",    desc: "Use the left panel to drag fixtures onto the canvas, or use Auto-place" },
                    { n: 3, title: "AI recommendations", desc: "Click AI in the left panel to get instant fixture suggestions for your room" },
                  ].map(({ n, title, desc }) => (
                    <div key={n} className="dash-step-row">
                      <div className="dash-step-num">{n}</div>
                      <div className="dash-step-body">
                        <div className="dash-step-title">{title}</div>
                        <div className="dash-step-desc">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── Right panel — independently scrollable ── */}
            <div className="dash-right-col">

              <div className="dash-widget">
                <div className="dash-widget-title">KEYBOARD SHORTCUTS</div>
                <div className="dash-tips-list">
                  {[
                    { icon: "⚡", key: "A",          tip: "Auto-place fixtures" },
                    { icon: "⌫", key: "Del",         tip: "Delete selected" },
                    { icon: "💾", key: "Ctrl+S",      tip: "Save project" },
                    { icon: "🔍", key: "Scroll",      tip: "Zoom in / out" },
                    { icon: "✋", key: "Space+drag",  tip: "Pan canvas" },
                    { icon: "⬚", key: "Click+drag",  tip: "Multi-select" },
                  ].map(({ icon, key, tip }) => (
                    <div key={key} className="dash-tip-row">
                      <span className="dash-tip-icon">{icon}</span>
                      <span className="dash-tip-key">{key}</span>
                      <span className="dash-tip-text">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dash-widget">
                <div className="dash-widget-title">SMART SUGGESTIONS</div>
                <div className="dash-suggestions-list">
                  {[
                    { icon: "◎", text: "Recommended lux for offices: 500 lux" },
                    { icon: "◈", text: "Use Heatmap to check illuminance uniformity" },
                    { icon: "⚡", text: "Auto-place saves 80% of design time" },
                    { icon: "◫", text: "DALI protocol allows per-fixture dimming" },
                    { icon: "▦", text: "Panel lights ideal for uniform coverage" },
                  ].map(({ icon, text }, i) => (
                    <div key={i} className="dash-suggestion-row">
                      <span className="dash-suggestion-icon">{icon}</span>
                      <span className="dash-suggestion-text">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage bar */}
              <div className="dash-widget">
                <div className="dash-widget-title">USAGE</div>
                <div className="usage-list">
                  <div className="usage-row">
                    <div className="usage-row-header">
                      <span className="usage-label">Projects</span>
                      <span className="usage-count">
                        {projects.length}{projectLimit === Infinity ? "" : `/${projectLimit}`}
                        {projectLimit === Infinity && <span className="usage-unlimited">unlimited</span>}
                      </span>
                    </div>
                    {projectLimit !== Infinity && (
                      <div className="usage-bar-track">
                        <div
                          className="usage-bar-fill"
                          style={{ width: `${Math.min(100, (projects.length / projectLimit) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {isPaid && (
                    <div className="usage-row">
                      <div className="usage-row-header">
                        <span className="usage-label">AI Calls (this month)</span>
                        <span className="usage-count">{aiUsed}/{aiLimit}</span>
                      </div>
                      <div className="usage-bar-track">
                        <div
                          className="usage-bar-fill"
                          style={{ width: `${Math.min(100, (aiUsed / aiLimit) * 100)}%`,
                                   background: aiUsed >= aiLimit ? '#ef4444' : undefined }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upgrade block — only for non-paid users */}
              {!isPaid && (
                <div className="dash-upgrade-block">
                  <div className="dash-upgrade-title">UNLOCK PRO FEATURES</div>
                  <div className="dash-upgrade-desc">Take your designs further</div>
                  <ul className="dash-upgrade-list">
                    <li>PDF + Excel Reports</li>
                    <li>DALI 2.0 Planning</li>
                    <li>AI Recommendations (50/mo)</li>
                    <li>10 Projects + floor plan upload</li>
                    <li>Priority Support</li>
                  </ul>
                  <button className="btn-upgrade" onClick={() => navigate('/dashboard', { state: { openTab: 'subscription' } })}>
                    Upgrade to Pro →
                  </button>
                </div>
              )}

              {/* Pro activated indicator */}
              {isPaid && (
                <div className="dash-pro-active">
                  <BadgeCheck size={16} color="#d4a843" strokeWidth={1.5} />
                  <div>
                    <div className="dash-pro-active-title">
                      {isProfessional ? "YOU'RE ON PROFESSIONAL" : "YOU'RE ON PRO"}
                    </div>
                    <div className="dash-pro-active-sub">All features unlocked</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {showWizard && <NewProjectWizard onClose={() => setShowWizard(false)} />}
    </>
  )
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({ user }) {
  const [displayName, setDisplayName] = useState(user.displayName ?? "")
  const [org,         setOrg]         = useState("")
  const [phone,       setPhone]       = useState("")
  const [jobTitle,    setJobTitle]    = useState("")
  const [saving,      setSaving]      = useState(false)
  const [msg,         setMsg]         = useState(null)

  useEffect(() => {
    getUserProfile(user.uid).then(p => {
      if (p?.displayName) setDisplayName(p.displayName)
      if (p?.org)         setOrg(p.org)
      if (p?.phone)       setPhone(p.phone)
      if (p?.jobTitle)    setJobTitle(p.jobTitle)
    }).catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true); setMsg(null)
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        org:         org.trim(),
        phone:       phone.trim(),
        jobTitle:    jobTitle.trim(),
      })
      await updateProfile(user, { displayName: displayName.trim() })
      setMsg({ type: "success", text: "Profile saved." })
    } catch (e) {
      setMsg({ type: "error", text: e.message })
    } finally {
      setSaving(false)
    }
  }

  const initials  = (displayName || user.email || "?").trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()
  const createdAt = user.metadata?.creationTime  ? new Date(user.metadata.creationTime)  : null
  const lastLogin = user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null

  return (
    <>
      {/* Avatar header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="profile-initials">{initials || "?"}</span>
        </div>
        <div className="profile-header-info">
          <div className="profile-display-name">{displayName || user.email?.split("@")[0] || "—"}</div>
          <div className="profile-email-line">{user.email}</div>
          {jobTitle && <div className="profile-job-tag">{jobTitle}</div>}
        </div>
      </div>

      <div className="dash-section-header" style={{ marginTop: 28 }}>
        <div className="dash-section-title">PERSONAL INFO</div>
      </div>
      <div className="form-section">
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input className="form-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label className="form-label">Job Title</label>
            <select className="form-input form-select" value={jobTitle} onChange={e => setJobTitle(e.target.value)}>
              <option value="">— Select role —</option>
              <option value="Lighting Designer">Lighting Designer</option>
              <option value="Architect">Architect</option>
              <option value="Electrical Engineer">Electrical Engineer</option>
              <option value="Interior Designer">Interior Designer</option>
              <option value="Consultant">Consultant</option>
              <option value="Student">Student</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={user.email ?? ""} disabled />
        </div>
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Organization</label>
            <input className="form-input" value={org} onChange={e => setOrg(e.target.value)} placeholder="Company or firm name" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 00000 00000" />
          </div>
        </div>
        {msg && <div className={msg.type === "success" ? "inline-success" : "inline-error"}>{msg.text}</div>}
        <div className="form-actions">
          <button className="btn-gold" disabled={saving} onClick={handleSave}>
            {saving ? "SAVING…" : "SAVE CHANGES"}
          </button>
        </div>
      </div>

      {/* Account info */}
      <div className="profile-account-card">
        <div className="profile-account-title">ACCOUNT INFO</div>
        <div className="profile-account-grid">
          <div className="profile-account-item">
            <div className="profile-account-label">Account Created</div>
            <div className="profile-account-value">{createdAt ? fmt(createdAt) : "—"}</div>
          </div>
          <div className="profile-account-item">
            <div className="profile-account-label">Last Login</div>
            <div className="profile-account-value">{lastLogin ? `${timeAgo(lastLogin)} · ${fmt(lastLogin)}` : "—"}</div>
          </div>
          <div className="profile-account-item">
            <div className="profile-account-label">Auth Provider</div>
            <div className="profile-account-value">{user.providerData?.[0]?.providerId ?? "email"}</div>
          </div>
          <div className="profile-account-item">
            <div className="profile-account-label">User ID</div>
            <div className="profile-account-value profile-account-uid">...{user.uid.slice(-8)}</div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab({ user }) {
  const navigate = useNavigate()
  const toast    = useToast()
  const [notifications, setNotifications] = useState(true)
  const [twoFA,         setTwoFA]         = useState(false)
  const [darkTheme,     setDarkTheme]     = useState(true)
  const [autoSave,      setAutoSave]      = useState(true)
  const [showGrid,      setShowGrid]      = useState(true)
  const [snapDefault,   setSnapDefault]   = useState(true)
  const [defaultUnit,   setDefaultUnit]   = useState("mm")
  const [defaultProto,  setDefaultProto]  = useState("NON-DIM")
  const [deleting,      setDeleting]      = useState(false)
  const [reAuthModal,   setReAuthModal]   = useState(false)
  const [reAuthPw,      setReAuthPw]      = useState("")
  const [reAuthErr,     setReAuthErr]     = useState("")
  const [reAuthing,     setReAuthing]     = useState(false)

  const isGoogle = user?.providerData?.[0]?.providerId === "google.com"

  async function _deleteAccountNow() {
    setDeleting(true)
    try {
      // Delete Firestore doc first, then Auth account
      await deleteDoc(doc(db, "users", user.uid))
      await deleteUser(user)
      navigate("/")
    } catch (e) {
      toast.error(`Delete failed: ${e.message}`)
      setDeleting(false)
    }
  }

  async function handleReAuth() {
    setReAuthErr("")
    setReAuthing(true)
    try {
      if (isGoogle) {
        const provider = new GoogleAuthProvider()
        await reauthenticateWithPopup(user, provider)
      } else {
        const cred = EmailAuthProvider.credential(user.email, reAuthPw)
        await reauthenticateWithCredential(user, cred)
      }
      setReAuthModal(false)
      await _deleteAccountNow()
    } catch (e) {
      const msg = e.code === "auth/wrong-password" ? "Incorrect password." :
                  e.code === "auth/popup-closed-by-user" ? "Google sign-in was cancelled." :
                  e.message
      setReAuthErr(msg)
    } finally {
      setReAuthing(false)
    }
  }

  return (
    <>
      <div className="dash-section-header">
        <div className="dash-section-title">SETTINGS</div>
      </div>

      <div className="settings-layout">

        {/* Left column */}
        <div className="settings-col">

          <div className="settings-group-title">CANVAS DEFAULTS</div>
          <div className="form-row-2" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Default Unit</label>
              <select className="form-input form-select" value={defaultUnit} onChange={e => setDefaultUnit(e.target.value)}>
                <option value="mm">Millimetres (mm)</option>
                <option value="cm">Centimetres (cm)</option>
                <option value="m">Metres (m)</option>
                <option value="ft">Feet (ft)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default Protocol</label>
              <select className="form-input form-select" value={defaultProto} onChange={e => setDefaultProto(e.target.value)}>
                <option value="NON-DIM">Non-dim</option>
                <option value="PHASE-CUT">Phase-cut (Triac)</option>
                <option value="0-10V">0-10V Analog</option>
                <option value="DALI">DALI</option>
                <option value="ZIGBEE">Zigbee</option>
              </select>
            </div>
          </div>

          <div className="settings-group-title" style={{ marginTop: 8 }}>BEHAVIOUR</div>
          <div className="toggle-list">
            {[
              { id: "autoSave",    label: "Auto-save",               desc: "Save projects automatically every 30 seconds", value: autoSave,    set: setAutoSave },
              { id: "snapDefault", label: "Snap to Grid by Default", desc: "Enable grid snap when opening a new room",     value: snapDefault,  set: setSnapDefault },
              { id: "showGrid",    label: "Show Grid Lines",         desc: "Display grid lines on the canvas",            value: showGrid,     set: setShowGrid },
            ].map(t => (
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
        </div>

        {/* Right column */}
        <div className="settings-col">

          <div className="settings-group-title">NOTIFICATIONS</div>
          <div className="toggle-list">
            {[
              { id: "notifications", label: "Email Notifications", desc: "Receive updates about your projects and account", value: notifications, set: setNotifications },
              { id: "darkTheme",     label: "Dark Theme",          desc: "Always use dark interface (current default)",     value: darkTheme,     set: setDarkTheme },
              { id: "twofa",         label: "Two-Factor Auth",     desc: "Extra security layer on sign in (coming soon)",   value: twoFA,         set: setTwoFA },
            ].map(t => (
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

          <div className="settings-group-title" style={{ marginTop: 24 }}>DANGER ZONE</div>
          <div className="settings-danger-box">
            <div className="settings-danger-desc">
              Permanently delete your account and all projects. This cannot be undone.
            </div>
            <button className="btn-danger" style={{ alignSelf: "flex-start", fontSize: 9 }} disabled={deleting} onClick={() => setReAuthModal(true)}>
              {deleting ? "DELETING…" : "DELETE ACCOUNT"}
            </button>
          </div>
        </div>

      </div>

      {/* Re-auth + delete confirmation modal */}
      {reAuthModal && (
        <div className="modal-overlay" onClick={() => setReAuthModal(false)}>
          <div className="reauth-modal" onClick={e => e.stopPropagation()}>
            <div className="reauth-modal-title">DELETE ACCOUNT</div>
            <div className="reauth-modal-body">
              This will permanently delete your account and all projects. This cannot be undone.
            </div>
            <div className="reauth-modal-body" style={{ marginTop: 8, color: '#888' }}>
              {isGoogle ? "Click below to confirm with your Google account." : "Enter your password to confirm."}
            </div>
            {!isGoogle && (
              <input
                className="reauth-modal-input"
                type="password"
                placeholder="Your password"
                value={reAuthPw}
                onChange={e => setReAuthPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleReAuth()}
                autoFocus
              />
            )}
            {reAuthErr && <div className="reauth-modal-err">{reAuthErr}</div>}
            <div className="reauth-modal-actions">
              <button className="btn-secondary" style={{ fontSize: 9 }} onClick={() => setReAuthModal(false)}>CANCEL</button>
              <button className="btn-danger" style={{ fontSize: 9 }} disabled={reAuthing || deleting} onClick={handleReAuth}>
                {reAuthing || deleting ? "VERIFYING…" : isGoogle ? "CONFIRM WITH GOOGLE" : "DELETE ACCOUNT"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Subscription tab ──────────────────────────────────────────────────────────

function SubscriptionTab({ user }) {
  const toast           = useToast()
  const confirm         = useConfirm()
  const { userDoc, getTrialStatus } = useAuth()
  const [billing,       setBilling]     = useState([])
  const [loading,       setLoading]     = useState(true)
  const [paying,        setPaying]      = useState(null)
  const [cancelling,    setCancelling]  = useState(false)

  // Subscription comes from AuthContext root-doc onSnapshot — single source of truth
  const sub = userDoc?.subscription ?? null
  const { status: trialStatus, daysLeft: trialDays = 0 } = getTrialStatus()
  const trialActive = trialStatus === 'trial'

  useEffect(() => {
    getBillingHistory(user.uid)
      .then(b => setBilling(b))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleUpgrade(plan) {
    setPaying(plan.id)
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
        description: `${plan.name} Plan — Monthly`,
        prefill: {
          name:  user.displayName ?? "",
          email: user.email       ?? "",
        },
        theme: { color: "#d4a843" },
        handler: async function (response) {
          // Step 3: verify HMAC + server writes subscription to Firestore
          try {
            const vRes = await fetch("/api/verify-payment", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                userId:              user.uid,
                planId:              plan.id,
              }),
            })
            const vData = await vRes.json()
            if (!vRes.ok) throw new Error(vData.error ?? "Verification failed")

            // Step 4: client-side fallback write if server couldn't reach Firestore
            const now    = new Date()
            const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            const amount = plan.amountPaise / 100
            if (!vData.firestoreWritten) {
              await createSubscription(user.uid, plan.id, response.razorpay_payment_id)
            }

            // Step 5: record billing
            await addBillingRecord(user.uid, {
              plan:        plan.id,
              amount,
              paymentId:   response.razorpay_payment_id,
              description: `${plan.name} Plan`,
            })

            // Step 6: refresh billing list (sub auto-updates via onSnapshot)
            setBilling(await getBillingHistory(user.uid))
            setPaying(null)
            toast.success(`${plan.name} plan activated! You now have full access.`)

            // Step 7: payment confirmation email (fire-and-forget)
            sendEmail(
              user.email,
              `Payment confirmed — Lumina Design ${plan.name} activated`,
              emailPaymentSuccess({
                name:        user.displayName,
                plan:        plan.id,
                amount,
                paymentId:   response.razorpay_payment_id,
                activatedAt: now,
                renewalDate: renewsAt,
              }),
            )
          } catch (e) {
            toast.error(`Activation failed: ${e.message}`)
            setPaying(null)
          }
        },
        modal: { ondismiss: () => setPaying(null) },
      })
      rzp.open()
    } catch (e) {
      toast.error(e.message)
      setPaying(null)
    }
  }

  async function handleCancel() {
    const ok = await confirm("Cancel your subscription? You'll keep access until the billing period ends.", {
      title: "CANCEL SUBSCRIPTION",
      confirmLabel: "CANCEL PLAN",
      danger: true,
    })
    if (!ok) return
    setCancelling(true)
    try {
      const accessUntil = sub?.renewsAt?.toDate?.() ?? sub?.renewsAt ?? null
      await cancelSubscription(user.uid)
      // onSnapshot will auto-update sub from root doc — no setSub needed
      toast.warning("Subscription cancelled. Access continues until the billing period ends.")

      // Send cancellation email (fire-and-forget)
      sendEmail(
        user.email,
        'Your Lumina Design subscription has been cancelled',
        emailSubscriptionCancelled({
          name:        user.displayName,
          plan:        sub?.plan,
          accessUntil,
        }),
      )
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCancelling(false)
    }
  }

  const currentPlanId = sub?.plan ?? null

  return (
    <>
      <div className="dash-section-header">
        <div className="dash-section-title">SUBSCRIPTION</div>
      </div>

      {/* Current Plan section — always visible */}
      <div className="current-plan-section">
        <div className="current-plan-section-label">CURRENT PLAN</div>
        <div className="current-plan-section-badge-row">
          {sub?.status === "active" ? (
            <span className="plan-badge">
              <span className="plan-badge-dot" style={{ background: "#d4a843" }} />
              {(sub.plan ?? "PRO").toUpperCase()}
            </span>
          ) : trialActive ? (
            <span className="plan-badge plan-badge-trial">
              <span className="plan-badge-dot" style={{ background: "#d4a843" }} />
              FREE TRIAL
            </span>
          ) : (
            <span className="plan-badge plan-badge-free">
              <span className="plan-badge-dot" style={{ background: "#888888" }} />
              FREE
            </span>
          )}
          {trialActive && (
            <span className="current-plan-section-trial-days">{trialDays} day{trialDays !== 1 ? "s" : ""} remaining</span>
          )}
          {sub?.renewsAt && sub?.status === "active" && (
            <span className="current-plan-section-renew">Renews {fmt(sub.renewsAt?.toDate?.() ?? sub.renewsAt)}</span>
          )}
          {sub?.status === "cancelled" && (
            <span className="current-plan-section-renew" style={{ color: "#d94f4f" }}>Cancelled — access until period end</span>
          )}
        </div>
      </div>

      {/* Cancel button — only for active paid subscriptions */}
      {sub?.status === "active" && (
        <div style={{ marginBottom: 24 }}>
          <button className="btn-danger" style={{ fontSize: 9 }} disabled={cancelling} onClick={handleCancel}>
            {cancelling ? "CANCELLING…" : "CANCEL PLAN"}
          </button>
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
                  {paying === plan.id ? "OPENING…" : "UPGRADE →"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Trust bar */}
      <div className="trust-bar">
        <div className="trust-bar-items">
          <span className="trust-bar-item">
            <Shield size={18} color="#d4a843" strokeWidth={1.5} />
            Secured by Razorpay
          </span>
          <span className="trust-bar-sep">|</span>
          <span className="trust-bar-item">
            <Lock size={18} color="#d4a843" strokeWidth={1.5} />
            SSL Encrypted
          </span>
          <span className="trust-bar-sep">|</span>
          <span className="trust-bar-item">
            <RefreshCw size={18} color="#d4a843" strokeWidth={1.5} />
            Cancel Anytime
          </span>
          <span className="trust-bar-sep">|</span>
          <span className="trust-bar-item">
            <BadgeCheck size={18} color="#d4a843" strokeWidth={1.5} />
            PCI DSS Compliant
          </span>
        </div>
        <div className="trust-bar-powered">
          <CreditCard size={14} color="#555555" strokeWidth={1.5} />
          <span>Payments powered by Razorpay</span>
        </div>
      </div>

      {/* Support */}
      <div className="sub-support-line">
        Questions? Email us at{" "}
        <a href="mailto:support@lightillumina.com" className="sub-support-link">
          support@lightillumina.com
        </a>
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
                  <td style={{ color: b.status === "paid" ? "#d4a843" : "#d94f4f" }}>
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
  const location   = useLocation()
  const [tab, setTab] = useState(() => location.state?.openTab ?? "projects")

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
          {tab === "projects" && <ProjectsTab user={user} />}
          {tab !== "projects" && (
            <div className="dash-tab-scroll">
              {tab === "profile"      && <ProfileTab      user={user} />}
              {tab === "settings"     && <SettingsTab      user={user} />}
              {tab === "subscription" && <SubscriptionTab user={user} />}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
