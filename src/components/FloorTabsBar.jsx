import { useState } from 'react'

const mono = { fontFamily: 'IBM Plex Mono, monospace' }

export default function FloorTabsBar() {
  const [active, setActive] = useState(0)
  const [floors, setFloors] = useState(['Floor 1'])

  const addFloor = () => {
    const next = [...floors, `Floor ${floors.length + 1}`]
    setFloors(next)
    setActive(next.length - 1)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: 30, minHeight: 30,
      background: '#080c11',
      borderBottom: '1px solid #131d28',
      flexShrink: 0,
      paddingLeft: 8,
    }}>
      <span style={{ ...mono, fontSize: 8, color: '#2d4f68', letterSpacing: '0.12em', marginRight: 10 }}>
        FLOOR
      </span>
      {floors.map((f, i) => (
        <button
          key={i}
          onClick={() => setActive(i)}
          style={{
            ...mono, fontSize: 9, padding: '0 14px', height: '100%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: active === i ? '#d4a843' : '#4a7a96',
            borderBottom: active === i ? '2px solid #d4a843' : '2px solid transparent',
            letterSpacing: '0.06em', whiteSpace: 'nowrap',
          }}
        >
          {f}
        </button>
      ))}
      <button
        onClick={addFloor}
        style={{
          ...mono, fontSize: 11, padding: '0 10px', height: '100%',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#2d4f68', borderBottom: '2px solid transparent',
        }}
      >
        +
      </button>
    </div>
  )
}
