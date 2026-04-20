import { useRef, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// ── Image reader ──────────────────────────────────────────────────────────────
function readImageFile(file) {
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

// ── PDF reader — renders page 1 to a blob URL ─────────────────────────────────
async function readPdfFile(file) {
  const buf  = await file.arrayBuffer()
  const pdf  = await pdfjsLib.getDocument({ data: buf }).promise
  const page = await pdf.getPage(1)
  const vp   = page.getViewport({ scale: 4 })

  const canvas  = document.createElement("canvas")
  canvas.width  = vp.width
  canvas.height = vp.height
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise

  // Convert to blob URL (avoids large base64 strings in state)
  const blobUrl = await new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error("canvas.toBlob returned null")); return }
      resolve(URL.createObjectURL(blob))
    }, "image/png")
  })

  return { url: blobUrl, width: vp.width, height: vp.height, scale: null, filename: file.name }
}

// ── Styles (new design system) ────────────────────────────────────────────────
const S = {
  wrap: {
    padding: "10px 14px",
    borderBottom: "1px solid #2e2e2e",
    fontFamily: "IBM Plex Mono",
    background: "#141414",
  },
  label: { fontSize: 10, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase" },
  note:  { fontSize: 10, color: "#555", fontStyle: "italic" },
  btn: {
    height: 26, padding: "0 12px", background: "transparent",
    border: "1px solid #2e2e2e", borderRadius: 4,
    color: "#888", fontFamily: "IBM Plex Mono", fontSize: 11,
    letterSpacing: "0.04em", cursor: "pointer",
    transition: "border-color 0.1s, color 0.1s",
  },
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FloorPlanUpload({ floorPlan, onUpload, onRemove }) {
  const inputRef             = useRef(null)
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState("")
  const [error,   setError]   = useState(null)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setError(null)
    setLoadMsg(file.type === "application/pdf" ? "Rendering PDF…" : "Loading…")
    try {
      const data = file.type === "application/pdf"
        ? await readPdfFile(file)
        : await readImageFile(file)
      onUpload(data)
    } catch {
      setError("PDF render failed, try PNG/JPG instead")
    } finally {
      setLoading(false)
      setLoadMsg("")
      e.target.value = ""
    }
  }

  return (
    <div style={S.wrap}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={S.label}>Floor Plan</span>
        <span style={S.note}>shared across all rooms</span>
      </div>

      {floorPlan ? (
        <>
          <div style={{ fontSize: 11, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
            {floorPlan.filename ?? "floor-plan"}
          </div>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 8 }}>
            {floorPlan.width} × {floorPlan.height}px
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              style={S.btn}
              onClick={() => inputRef.current?.click()}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#f0f0f0" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2e2e2e"; e.currentTarget.style.color = "#888" }}
            >Replace</button>
            <button
              style={S.btn}
              onClick={onRemove}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#e05252"; e.currentTarget.style.color = "#e05252" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2e2e2e"; e.currentTarget.style.color = "#888" }}
            >Remove</button>
          </div>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          style={{
            ...S.btn,
            width: "100%", height: 30, textAlign: "center",
            color: loading ? "#555" : "#888",
            cursor: loading ? "default" : "pointer",
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#f0f0f0" } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#2e2e2e"; e.currentTarget.style.color = loading ? "#555" : "#888" }}
        >
          {loading ? loadMsg : "Upload PNG / JPG / PDF"}
        </button>
      )}

      {error && (
        <div style={{ color: "#e05252", fontSize: 10, marginTop: 6, letterSpacing: "0.02em" }}>{error}</div>
      )}

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
