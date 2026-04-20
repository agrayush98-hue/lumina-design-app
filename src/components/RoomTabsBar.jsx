import { useState, useRef, useEffect } from "react"
import styles from "../App.module.css"

export default function RoomTabsBar({ rooms, activeRoomId, onSelectRoom, onAddRoom, onRenameRoom, onDeleteRoom }) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState("")
  const [hoveredId, setHoveredId] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editingId !== null) inputRef.current?.focus()
  }, [editingId])

  function startEdit(room, e) {
    e.stopPropagation()
    setEditingId(room.id)
    setEditValue(room.name)
  }

  function commitEdit() {
    if (editingId !== null) {
      const trimmed = editValue.trim()
      if (trimmed) onRenameRoom(editingId, trimmed)
      setEditingId(null)
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") commitEdit()
    if (e.key === "Escape") setEditingId(null)
  }

  const canDelete = rooms.length > 1

  return (
    <div className={styles.tabBar} style={{ borderBottom: "1px solid #2e2e2e" }}>
      {rooms.map(room => {
        const isActive  = room.id === activeRoomId
        const isEditing = room.id === editingId
        const isHovered = room.id === hoveredId
        return (
          <div
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            onDoubleClick={e => startEdit(room, e)}
            onMouseEnter={() => setHoveredId(room.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                onClick={e => e.stopPropagation()}
                style={{
                  background: "transparent", border: "none", outline: "none",
                  color: isActive ? "#f0f0f0" : "#888",
                  fontFamily: "IBM Plex Mono", fontSize: 12,
                  width: Math.max(editValue.length, 4) + "ch",
                  padding: 0,
                }}
              />
            ) : (
              <span>{room.name}</span>
            )}
            {isHovered && canDelete && (
              <span
                onClick={e => { e.stopPropagation(); onDeleteRoom(room.id) }}
                style={{ fontSize: 14, lineHeight: 1, color: "#555", cursor: "pointer", userSelect: "none", transition: "color 0.1s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#e05252" }}
                onMouseLeave={e => { e.currentTarget.style.color = "#555" }}
              >×</span>
            )}
          </div>
        )
      })}
      <button className={styles.tabAdd} onClick={onAddRoom} title="Add room">+</button>
    </div>
  )
}
