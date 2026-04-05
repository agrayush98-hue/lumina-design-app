const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalStyle = {
  background: '#0d1117',
  color: '#cdd9e5',
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 11,
  padding: '20px 24px',
  letterSpacing: '0.08em',
  border: '1px solid #1a2b3c',
  borderRadius: 4,
  minWidth: 280,
}

const closeBtnStyle = {
  marginTop: 12,
  background: 'none',
  border: '1px solid #2a3a4a',
  color: '#cdd9e5',
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 11,
  padding: '4px 10px',
  cursor: 'pointer',
}

export default function LoadProjectModal({ onClose }) {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div>LOAD PROJECT</div>
        <button style={closeBtnStyle} onClick={onClose}>CLOSE</button>
      </div>
    </div>
  )
}
