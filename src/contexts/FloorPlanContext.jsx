import { createContext, useContext, useState, useCallback } from 'react'

const FloorPlanContext = createContext(null)

const mkId = () => Math.random().toString(36).slice(2, 9)

const ROOM_COLORS = [
  { fill: '#00e5ff22', stroke: '#00e5ff' },
  { fill: '#3dba7422', stroke: '#3dba74' },
  { fill: '#d4a84322', stroke: '#d4a843' },
  { fill: '#a78bfa22', stroke: '#a78bfa' },
  { fill: '#f4723422', stroke: '#f47234' },
  { fill: '#e879f922', stroke: '#e879f9' },
]

function pickColor(rooms) {
  return ROOM_COLORS[rooms.length % ROOM_COLORS.length]
}

export function FloorPlanProvider({ children }) {
  const [floors, setFloors] = useState([
    { id: 'floor-1', name: 'Floor 1', planImage: null, rooms: [] },
  ])
  const [activeFloorId, setActiveFloorId] = useState('floor-1')
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [drawingMode, setDrawingMode] = useState(false)
  const [drawingPoints, setDrawingPoints] = useState([])

  const activeFloor = floors.find((f) => f.id === activeFloorId) || floors[0]
  const activeRoom = activeFloor?.rooms.find((r) => r.id === activeRoomId) || null

  const setFloorImage = useCallback((floorId, imageDataURL) => {
    setFloors((prev) =>
      prev.map((f) => (f.id === floorId ? { ...f, planImage: imageDataURL } : f))
    )
  }, [])

  const addFloor = useCallback(() => {
    const id = `floor-${mkId()}`
    const name = `Floor ${floors.length + 1}`
    setFloors((prev) => [...prev, { id, name, planImage: null, rooms: [] }])
    setActiveFloorId(id)
    setActiveRoomId(null)
  }, [floors.length])

  const renameFloor = useCallback((floorId, name) => {
    setFloors((prev) => prev.map((f) => (f.id === floorId ? { ...f, name } : f)))
  }, [])

  const deleteFloor = useCallback((floorId) => {
    setFloors((prev) => {
      const next = prev.filter((f) => f.id !== floorId)
      if (next.length === 0) return prev
      return next
    })
    setActiveFloorId((prev) => {
      const remaining = floors.filter((f) => f.id !== floorId)
      return remaining.length > 0 ? remaining[0].id : prev
    })
  }, [floors])

  const startDrawing = useCallback(() => {
    setDrawingMode(true)
    setDrawingPoints([])
  }, [])

  const cancelDrawing = useCallback(() => {
    setDrawingMode(false)
    setDrawingPoints([])
  }, [])

  const addDrawingPoint = useCallback((x, y) => {
    setDrawingPoints((prev) => [...prev, { x, y }])
  }, [])

  const finishDrawing = useCallback((roomData) => {
    if (drawingPoints.length < 3) return
    const id = `room-${mkId()}`
    const color = pickColor(activeFloor.rooms)
    const newRoom = {
      id,
      name: roomData.name,
      realWidth: roomData.realWidth,
      realLength: roomData.realLength,
      polygon: drawingPoints,
      fill: color.fill,
      stroke: color.stroke,
    }
    setFloors((prev) =>
      prev.map((f) =>
        f.id === activeFloorId
          ? { ...f, rooms: [...f.rooms, newRoom] }
          : f
      )
    )
    setActiveRoomId(id)
    setDrawingMode(false)
    setDrawingPoints([])
  }, [drawingPoints, activeFloor, activeFloorId])

  const updateRoom = useCallback((floorId, roomId, updates) => {
    setFloors((prev) =>
      prev.map((f) =>
        f.id === floorId
          ? { ...f, rooms: f.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r)) }
          : f
      )
    )
  }, [])

  const deleteRoom = useCallback((floorId, roomId) => {
    setFloors((prev) =>
      prev.map((f) =>
        f.id === floorId ? { ...f, rooms: f.rooms.filter((r) => r.id !== roomId) } : f
      )
    )
    setActiveRoomId((prev) => (prev === roomId ? null : prev))
  }, [])

  return (
    <FloorPlanContext.Provider value={{
      floors, activeFloor, activeFloorId, setActiveFloorId,
      activeRoom, activeRoomId, setActiveRoomId,
      drawingMode, drawingPoints,
      setFloorImage, addFloor, renameFloor, deleteFloor,
      startDrawing, cancelDrawing, addDrawingPoint, finishDrawing,
      updateRoom, deleteRoom,
    }}>
      {children}
    </FloorPlanContext.Provider>
  )
}

export function useFloorPlan() {
  return useContext(FloorPlanContext)
}
