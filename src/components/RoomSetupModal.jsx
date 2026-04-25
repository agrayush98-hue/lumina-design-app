import { useState } from 'react'

const mono = { fontFamily: 'IBM Plex Mono, monospace' }

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#0a0a0a', border: '1px solid #222222',
    borderRadius: 6, padding: 24, width: 340,
    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
  },
  title: { ...mono, fontSize: 12, color: '#d4a843', letterSpacing: '0.1em', marginBottom: 20 },
  label: { ...mono, fontSize: 9, color: '#666666', letterSpacing: '0.08em', marginBottom: 4, display: 'block' },
  input: {
    ...mono, fontSize: 11, width: '100%', boxSizing: 'border-box',
    background: '#0d0d0d', color: '#cccccc', border: '1px solid #222222',
    borderRadius: 3, padding: '7px 10px', marginBottom: 14, outline: 'none',
  },
  row: { display: 'flex', gap: 12 },
  rowItem: { flex: 1 },
  btnRow: { display: 'flex', gap: 8, marginTop: 8 },
  btnOk: {
    ...mono, flex: 1, padding: '8px 0', fontSize: 10, letterSpacing: '0.08em',
    background: '#d4a843', color: '#000000', border: 'none',
    borderRadius: 3, cursor: 'pointer', fontWeight: 700,
  },
  btnCancel: {
    ...mono, padding: '8px 16px', fontSize: 10, letterSpacing: '0.08em',
    background: 'transparent', color: '#ffffff', border: '1px solid #444444',
    borderRadius: 3, cursor: 'pointer',
  },
  hint: { ...mono, fontSize: 8, color: '#444444', marginBottom: 16, letterSpacing: '0.06em' },
}

export default function RoomSetupModal({ pointCount, onConfirm, onCancel }) {
  const [name, setName] = useState('')
  const [realWidth, setRealWidth] = useState('')
  const [realLength, setRealLength] = useState('')

  const handleOk = () => {
    const w = parseFloat(realWidth)
    const l = parseFloat(realLength)
    if (!name.trim() || isNaN(w) || isNaN(l) || w <= 0 || l <= 0) return
    onConfirm({ name: name.trim(), realWidth: w, realLength: l })
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleOk() }

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={S.modal}>
        <div style={S.title}>ROOM SETUP</div>
        <div style={S.hint}>{pointCount} points drawn · enter real-world dimensions</div>

        <label style={S.label}>ROOM NAME</label>
        <input
          style={S.input} autoFocus value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKey} placeholder="e.g. Living Room"
        />

        <div style={S.row}>
          <div style={S.rowItem}>
            <label style={S.label}>WIDTH (m)</label>
            <input
              style={S.input} type="number" min="0.1" step="0.1"
              value={realWidth} onChange={(e) => setRealWidth(e.target.value)}
              onKeyDown={handleKey} placeholder="e.g. 20"
            />
          </div>
          <div style={S.rowItem}>
            <label style={S.label}>LENGTH (m)</label>
            <input
              style={S.input} type="number" min="0.1" step="0.1"
              value={realLength} onChange={(e) => setRealLength(e.target.value)}
              onKeyDown={handleKey} placeholder="e.g. 22"
            />
          </div>
        </div>

        <div style={S.btnRow}>
          <button style={S.btnCancel} onClick={onCancel}>CANCEL</button>
          <button style={S.btnOk} onClick={handleOk}>SAVE ROOM</button>
        </div>
      </div>
    </div>
  )
}
