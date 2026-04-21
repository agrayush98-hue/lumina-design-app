import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { PROJECT_TEMPLATES } from "../templates/projectTemplates"
import "./NewProjectWizard.css"

const STEPS = { CHOICE: "choice", TEMPLATE: "template", BLANK: "blank" }

export default function NewProjectWizard({ onClose, onLimitError }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(STEPS.CHOICE)
  const [projectName, setProjectName] = useState("")
  const fileRef = useRef(null)

  function launchTemplate(tpl) {
    try { sessionStorage.setItem("lumina_pending_template", JSON.stringify(tpl)) } catch {}
    navigate(`/app?new=${encodeURIComponent(tpl.name)}`)
  }

  function launchBlank() {
    const name = projectName.trim() || "Untitled Project"
    navigate(`/app?new=${encodeURIComponent(name)}`)
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const name = projectName.trim() || file.name.replace(/\.[^.]+$/, "")
    try { sessionStorage.setItem("lumina_pending_floorplan", file.name) } catch {}
    navigate(`/app?new=${encodeURIComponent(name)}`)
  }

  return (
    <div className="nwz-overlay" onClick={onClose}>
      <div className="nwz-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="nwz-header">
          <div>
            <div className="nwz-title">NEW PROJECT</div>
            <div className="nwz-subtitle">Choose how you'd like to start</div>
          </div>
          <button className="nwz-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Step: choose mode ── */}
        {step === STEPS.CHOICE && (
          <div className="nwz-choices">
            <button className="nwz-choice-card" onClick={() => setStep(STEPS.TEMPLATE)}>
              <div className="nwz-choice-icon" style={{ color: "#d4a843" }}>⬡</div>
              <div className="nwz-choice-label">Start from Template</div>
              <div className="nwz-choice-desc">Pre-built professional layouts — conference rooms, hotels, retail, and more</div>
              <div className="nwz-choice-arrow">→</div>
            </button>

            <button className="nwz-choice-card" onClick={() => fileRef.current?.click()}>
              <div className="nwz-choice-icon" style={{ color: "#39c5cf" }}>⤒</div>
              <div className="nwz-choice-label">Upload Floor Plan</div>
              <div className="nwz-choice-desc">Import a PNG, JPG, or PDF floor plan and trace over it</div>
              <div className="nwz-choice-arrow">→</div>
              <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleFileUpload} />
            </button>

            <button className="nwz-choice-card" onClick={() => setStep(STEPS.BLANK)}>
              <div className="nwz-choice-icon" style={{ color: "#888" }}>◻</div>
              <div className="nwz-choice-label">Blank Canvas</div>
              <div className="nwz-choice-desc">Start from scratch with an empty room and your own dimensions</div>
              <div className="nwz-choice-arrow">→</div>
            </button>
          </div>
        )}

        {/* ── Step: template gallery ── */}
        {step === STEPS.TEMPLATE && (
          <div className="nwz-templates">
            <button className="nwz-back" onClick={() => setStep(STEPS.CHOICE)}>← Back</button>
            <div className="nwz-gallery">
              {PROJECT_TEMPLATES.map(tpl => (
                <button key={tpl.id} className="nwz-tpl-card" onClick={() => launchTemplate(tpl)}>
                  <div className="nwz-tpl-preview" style={{ background: `${tpl.accentColor}18`, borderColor: `${tpl.accentColor}44` }}>
                    <span className="nwz-tpl-icon" style={{ color: tpl.accentColor }}>{tpl.icon}</span>
                    <div className="nwz-tpl-fixtures">
                      {tpl.floors[0]?.rooms[0]?.lights?.slice(0, 9).map((l, i) => (
                        <div key={i} className="nwz-tpl-dot" style={{ background: l.fill, boxShadow: `0 0 4px ${l.stroke}` }} />
                      ))}
                    </div>
                  </div>
                  <div className="nwz-tpl-meta">
                    <div className="nwz-tpl-cat" style={{ color: tpl.accentColor }}>{tpl.category}</div>
                    <div className="nwz-tpl-name">{tpl.name}</div>
                    <div className="nwz-tpl-desc">{tpl.description}</div>
                    <div className="nwz-tpl-stats">
                      <span>{tpl.floors[0]?.rooms[0]?.lights?.length ?? 0} fixtures</span>
                      <span>·</span>
                      <span>{tpl.floors[0]?.rooms[0]?.room?.targetLux} lux target</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: blank canvas ── */}
        {step === STEPS.BLANK && (
          <div className="nwz-blank">
            <button className="nwz-back" onClick={() => setStep(STEPS.CHOICE)}>← Back</button>
            <div className="nwz-blank-form">
              <label className="nwz-label">PROJECT NAME</label>
              <input
                className="nwz-input"
                autoFocus
                placeholder="e.g. Office Floor 3"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") launchBlank() }}
              />
              <div className="nwz-blank-actions">
                <button className="nwz-btn-secondary" onClick={onClose}>CANCEL</button>
                <button className="nwz-btn-primary" onClick={launchBlank}>CREATE PROJECT →</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
