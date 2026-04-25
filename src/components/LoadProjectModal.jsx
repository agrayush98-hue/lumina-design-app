import { useState, useEffect } from "react"
import { listProjects, loadProject, deleteProject } from "../firebase"
import { useConfirm } from "./ConfirmModal"

const C = {
  bg:      "#0a0a0a",
  panel:   "#0a0a0a",
  border:  "#222222",
  accent:  "#d4a843",
  label:   "#444444",
  value:   "#cccccc",
  dim:     "#ffffff",
  hover:   "#111111",
  red:     "#d94f4f",
  redDim:  "#1a0808",
}

function fmt(date) {
  if (!date) return "—"
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

export default function LoadProjectModal({ userId, onLoad, onClose }) {
  const confirm  = useConfirm()
  const [projects,  setProjects]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [loadingId,  setLoadingId]  = useState(null)

  async function fetchProjects() {
    setLoading(true)
    setError(null)
    try {
      setProjects(await listProjects(userId))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjects() }, [])

  async function handleLoad(proj) {
    setLoadingId(proj.id)
    try {
      const data = await loadProject(proj.id)
      onLoad(proj.id, data)
    } catch (e) {
      setError(`Load failed: ${e.message}`)
      setLoadingId(null)
    }
  }

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
    } catch (err) {
      setError(`Delete failed: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 600, maxHeight: "70vh",
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 8, display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,212,255,0.06)",
          fontFamily: "IBM Plex Mono",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
          background: C.panel, borderRadius: "8px 8px 0 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, opacity: 0.7 }} />
            <span style={{ color: C.accent, fontSize: 11, letterSpacing: "0.14em" }}>LOAD PROJECT</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {loading && (
            <div style={{ padding: "30px 0", textAlign: "center", color: C.label, fontSize: 10, letterSpacing: "0.1em" }}>
              Loading projects…
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: "12px 16px", color: C.red, fontSize: 10 }}>{error}</div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div style={{ padding: "30px 0", textAlign: "center", color: C.label, fontSize: 10, letterSpacing: "0.08em" }}>
              No saved projects found.
            </div>
          )}

          {!loading && projects.map(proj => (
            <div
              key={proj.id}
              onClick={() => handleLoad(proj)}
              style={{
                display: "flex", alignItems: "center",
                padding: "10px 16px", cursor: "pointer",
                borderBottom: `1px solid ${C.border}`,
                background: loadingId === proj.id ? C.hover : "transparent",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => { if (loadingId !== proj.id) e.currentTarget.style.background = C.hover }}
              onMouseLeave={e => { if (loadingId !== proj.id) e.currentTarget.style.background = "transparent" }}
            >
              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.value, fontSize: 11, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {proj.name}
                </div>
                <div style={{ display: "flex", gap: 14, color: C.label, fontSize: 9 }}>
                  <span>{fmt(proj.updatedAt)}</span>
                  {proj.floorCount != null && <span>{proj.floorCount} floor{proj.floorCount !== 1 ? "s" : ""}</span>}
                  {proj.roomCount  != null && <span>{proj.roomCount}  room{proj.roomCount  !== 1 ? "s" : ""}</span>}
                </div>
              </div>

              {/* Loading indicator */}
              {loadingId === proj.id && (
                <span style={{ color: C.accent, fontSize: 9, marginRight: 10, letterSpacing: "0.08em" }}>Loading…</span>
              )}

              {/* Delete button */}
              <button
                onClick={e => handleDelete(e, proj.id)}
                disabled={deletingId === proj.id}
                title="Delete project"
                style={{
                  background: "none", border: `1px solid ${C.border}`,
                  borderRadius: 3, color: C.red, cursor: "pointer",
                  padding: "3px 8px", fontFamily: "IBM Plex Mono", fontSize: 10,
                  opacity: deletingId === proj.id ? 0.4 : 1,
                  flexShrink: 0, marginLeft: 8,
                }}
              >
                {deletingId === proj.id ? "…" : "🗑"}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "8px 16px", borderTop: `1px solid ${C.border}`,
          color: C.label, fontSize: 9, letterSpacing: "0.06em",
        }}>
          Click a project to load · Trash icon to delete permanently
        </div>
      </div>
    </div>
  )
}
