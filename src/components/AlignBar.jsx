export default function AlignBar({ selectedCount, onAlign, canUndo, onUndo }) {
  if (selectedCount === 0) return null

  const mono = 'IBM Plex Mono, monospace'
  const base = {
    fontFamily: mono, padding: '4px 9px', fontSize: 10,
    background: '#0d1117', border: '1px solid #1a2b3c',
    borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1.2,
  }

  const Btn = ({ label, action, title, color = '#4a7a96', disabled = false }) => (
    <button
      onClick={() => !disabled && onAlign(action)}
      title={title}
      style={{ ...base, color: disabled ? '#2d4f68' : color, cursor: disabled ? 'default' : 'pointer' }}
    >{label}</button>
  )

  const Sep = () => (
    <div style={{ width: 1, height: 16, background: '#1a2b3c', margin: '0 2px', flexShrink: 0 }} />
  )

  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'nowrap',
      background: '#060a0e', border: '1px solid #1e2d40', borderRadius: 8,
      padding: '6px 12px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,229,255,0.05)',
      fontFamily: mono, fontSize: 9, userSelect: 'none',
    }}>
      <span style={{ color: '#d4a843', fontSize: 10, fontWeight: 600, marginRight: 4 }}>
        {selectedCount} sel
      </span>

      <Sep />

      {selectedCount >= 2 && (
        <>
          <span style={{ color: '#2d4f68', fontSize: 8, letterSpacing: '0.06em', marginRight: 2 }}>ALIGN</span>
          <Btn label="⊢ L" action="left"    title="Align left edges" />
          <Btn label="— H" action="centerH" title="Center horizontally" />
          <Btn label="R ⊣" action="right"   title="Align right edges" />
          <Sep />
          <Btn label="⊤ T" action="top"     title="Align top edges" />
          <Btn label="| V" action="centerV" title="Center vertically" />
          <Btn label="B ⊥" action="bottom"  title="Align bottom edges" />
          <Sep />
          <span style={{ color: '#2d4f68', fontSize: 8, letterSpacing: '0.06em', marginRight: 2 }}>DIST</span>
          <Btn label="⇹ H" action="distH" title="Distribute equal spacing — horizontal" color="#6ae5ff" disabled={selectedCount < 3} />
          <Btn label="⇅ V" action="distV" title="Distribute equal spacing — vertical"   color="#6ae5ff" disabled={selectedCount < 3} />
          <Sep />
        </>
      )}

      <Btn label="⊞ SNAP" action="snapGrid" title="Snap all selected to nearest grid point" color="#a78bfa" />

      {canUndo && (
        <>
          <Sep />
          <button
            onClick={onUndo}
            title="Undo last alignment (Ctrl+Z)"
            style={{ ...base, background: '#0e1e0e', color: '#3dba74', border: '1px solid #1e3e1e' }}
          >↩ Undo</button>
        </>
      )}

      <Sep />

      <span style={{ color: '#2d4f68', fontSize: 8, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
        ↑↓←→ nudge · Shift ×10 · Ctrl+C/X/V/D · Del · Esc
      </span>
    </div>
  )
}
