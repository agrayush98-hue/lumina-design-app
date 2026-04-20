import { useRef, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import RoomSettingsPanel from "./RoomSettingsPanel"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

async function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = e => {
      const url = e.target.result
      const img = new window.Image()
      img.onload  = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight, scale: null, filename: file.name })
      img.onerror = reject
      img.src = url
    }
    reader.readAsDataURL(file)
  })
}

async function readPdfFile(file) {
  const buf  = await file.arrayBuffer()
  const pdf  = await pdfjsLib.getDocument({ data: buf }).promise
  const page = await pdf.getPage(1)
  const vp   = page.getViewport({ scale: 2 })
  const canvas  = document.createElement("canvas")
  canvas.width  = vp.width
  canvas.height = vp.height
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise
  const blobUrl = await new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error("toBlob returned null")); return }
      resolve(URL.createObjectURL(blob))
    }, "image/png")
  })
  return { url: blobUrl, width: vp.width, height: vp.height, scale: null, filename: file.name }
}

// ── Sub-component: floor plan section ────────────────────────────────────────
function FloorPlanSection({ floorPlan, onUpload, onRemove, activeTool, onSetActiveTool }) {
  const inputRef              = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const isDrawRoom = activeTool === "draw-room"

  const linkBtn = {
    background: "none", border: "none", padding: 0,
    fontFamily: "IBM Plex Mono", fontSize: 11, cursor: "pointer",
    letterSpacing: "0.03em", textDecoration: "underline",
    textDecorationColor: "transparent", transition: "color 0.1s, text-decoration-color 0.1s",
  }

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const data = file.type === "application/pdf"
        ? await readPdfFile(file)
        : await readImageFile(file)
      onUpload(data)
    } catch {
      setError("PDF render failed, try PNG/JPG instead")
    } finally {
      setLoading(false)
      e.target.value = ""
    }
  }

  return (
    <div style={{ padding: "14px 16px", borderBottom: "1px solid #2e2e2e" }}>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
        Floor Plan
      </div>

      {floorPlan ? (
        <>
          <div style={{ fontSize: 12, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
            {floorPlan.filename ?? "floor-plan"}
          </div>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 10 }}>
            {floorPlan.width} × {floorPlan.height}px
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <button
              style={{ ...linkBtn, color: "#888" }}
              onClick={() => inputRef.current?.click()}
              onMouseEnter={e => { e.currentTarget.style.color = "#f0f0f0"; e.currentTarget.style.textDecorationColor = "#f0f0f0" }}
              onMouseLeave={e => { e.currentTarget.style.color = "#888"; e.currentTarget.style.textDecorationColor = "transparent" }}
            >Replace</button>
            <button
              style={{ ...linkBtn, color: "#888" }}
              onClick={onRemove}
              onMouseEnter={e => { e.currentTarget.style.color = "#e05252"; e.currentTarget.style.textDecorationColor = "#e05252" }}
              onMouseLeave={e => { e.currentTarget.style.color = "#888"; e.currentTarget.style.textDecorationColor = "transparent" }}
            >Remove</button>
          </div>
          {/* Draw Room button */}
          <button
            onClick={() => { console.log('[SETTINGS DRAW ROOM CLICKED]'); onSetActiveTool(isDrawRoom ? "fixture" : "draw-room") }}
            style={{
              width: "100%", height: 30,
              background: isDrawRoom ? "#1a1500" : "transparent",
              border: `1px solid ${isDrawRoom ? "#d4a843" : "#2e2e2e"}`,
              borderRadius: 4,
              color: isDrawRoom ? "#d4a843" : "#888",
              fontFamily: "IBM Plex Mono", fontSize: 11,
              cursor: "pointer", letterSpacing: "0.04em",
              transition: "all 0.1s",
            }}
            onMouseEnter={e => { if (!isDrawRoom) { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#f0f0f0" } }}
            onMouseLeave={e => { if (!isDrawRoom) { e.currentTarget.style.borderColor = "#2e2e2e"; e.currentTarget.style.color = "#888" } }}
            title="Draw room boundary on the floor plan"
          >{isDrawRoom ? "Drawing Room…  (click to cancel)" : "Draw Room Boundary"}</button>
        </>
      ) : (
        <div
          onClick={() => !loading && inputRef.current?.click()}
          style={{
            height: 90, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 4,
            background: "#222", border: "1px dashed #2e2e2e", borderRadius: 4,
            cursor: loading ? "default" : "pointer",
            transition: "border-color 0.1s",
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = "#555" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#2e2e2e" }}
        >
          <div style={{ fontSize: 12, color: loading ? "#555" : "#888" }}>
            {loading ? "Rendering PDF…" : "Upload floor plan"}
          </div>
          {!loading && (
            <div style={{ fontSize: 10, color: "#555" }}>PNG, JPG or PDF</div>
          )}
        </div>
      )}

      {error && <div style={{ fontSize: 10, color: "#e05252", marginTop: 6 }}>{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        onChange={handleFile}
        style={{ display: "none" }}
      />
    </div>
  )
}

// ── Main floating panel ───────────────────────────────────────────────────────
export default function RoomSettingsFloating({
  room, setRoom, calculations,
  pos, onStartDrag, onClose,
  floorPlan, onUploadFloorPlan, onRemoveFloorPlan,
  activeTool, onSetActiveTool,
}) {
  return (
    <div style={{
      position: "absolute",
      left: pos.x,
      top: pos.y,
      width: 300,
      maxHeight: "85vh",
      background: "#141414",
      border: "1px solid #2e2e2e",
      borderRadius: 6,
      zIndex: 100,
      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* Drag header */}
      <div
        onMouseDown={onStartDrag}
        style={{
          padding: "10px 14px",
          background: "#1a1a1a",
          borderBottom: "1px solid #2e2e2e",
          cursor: "grab",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Room Settings
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", color: "#555",
            cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1,
            fontFamily: "IBM Plex Mono", transition: "color 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f0f0f0" }}
          onMouseLeave={e => { e.currentTarget.style.color = "#555" }}
          title="Close"
        >✕</button>
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {/* Floor plan section at top */}
        <FloorPlanSection
          floorPlan={floorPlan}
          onUpload={onUploadFloorPlan}
          onRemove={onRemoveFloorPlan}
          activeTool={activeTool}
          onSetActiveTool={onSetActiveTool}
        />

        {/* Room settings fields */}
        <RoomSettingsPanel
          room={room}
          setRoom={setRoom}
          calculations={calculations}
          style={{ width: "100%", border: "none", borderRadius: 0, background: "transparent", boxSizing: "border-box" }}
        />
      </div>
    </div>
  )
}
