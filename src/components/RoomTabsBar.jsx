import { useState } from 'react'

const mono = { fontFamily: 'IBM Plex Mono, monospace' }

export default function RoomTabsBar() {
  const [active, setActive] = useState(0)
  const [rooms, setRooms] = useState(['Room 1'])

  const addRoom = () => {
    const next = [...rooms, `Room ${rooms.length + 1}`]
    setRooms(next)
    setActive(next.length - 1)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: 30, minHeight: 30,
      background: '#060a0e',
      borderBottom: '1px solid #131d28',
      flexShrink: 0,
      paddingLeft: 8,
    }}>
      <span style={{ ...mono, fontSize: 8, color: '#2d4f68', letterSpacing: '0.12em', marginRight: 10 }}>
        ROOM
      </span>
      {rooms.map((r, i) => (
        <button
          key={i}
          onClick={() => setActive(i)}
          style={{
            ...mono, fontSize: 9, padding: '0 14px', height: '100%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: active === i ? '#6ae5ff' : '#4a7a96',
            borderBottom: active === i ? '2px solid #6ae5ff' : '2px solid transparent',
            letterSpacing: '0.06em', whiteSpace: 'nowrap',
          }}
        >
          {r}
        </button>
      ))}
      <button
        onClick={addRoom}
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
