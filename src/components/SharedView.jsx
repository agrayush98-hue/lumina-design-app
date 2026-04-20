import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { loadSharedProject } from "../firebase"
import DesignCanvas from "./DesignCanvas"
import ReportPanel from "./ReportPanel"
import { FIXTURE_LIBRARY } from "../data/fixtureLibrary"

const CANVAS_W = 1000

export default function SharedView() {
  const { projectId } = useParams()
  const [project,     setProject]     = useState(null)
  const [error,       setError]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [showReport,  setShowReport]  = useState(false)

  // Active floor/room navigation (read-only)
  const [activeFloorId, setActiveFloorId] = useState(null)
  const [activeRoomId,  setActiveRoomId]  = useState(null)

  useEffect(() => {
    loadSharedProject(projectId)
      .then(data => {
        setProject(data)
        const firstFloor = data.floors[0]
        setActiveFloorId(firstFloor.id)
        setActiveRoomId(firstFloor.rooms[0].id)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) return (
    <div style={{
      position: "fixed", inset: 0, background: "#090c10",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "IBM Plex Mono", fontSize: 11, color: "#2d4f68", letterSpacing: "0.12em",
    }}>
      LOADING PROJECT...
    </div>
  )

  if (error) return (
    <div style={{
      position: "fixed", inset: 0, background: "#090c10",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "IBM Plex Mono", gap: 12,
    }}>
      <div style={{ fontSize: 11, color: "#d94f4f", letterSpacing: "0.1em" }}>UNABLE TO LOAD PROJECT</div>
      <div style={{ fontSize: 10, color: "#2d4f68" }}>{error}</div>
    </div>
  )

  const { floors, name: projectName, daliEnabled, busTopologies = {} } = project
  const activeFloor = floors.find(f => f.id === activeFloorId) ?? floors[0]
  const activeRoom  = activeFloor.rooms.find(r => r.id === activeRoomId) ?? activeFloor.rooms[0]
  const lights      = activeRoom.lights

  // Compute display lux for active room
  const {
    roomWidth:          roomWidthRaw   = 6000,
    roomHeight:         roomHeightRaw  = 4000,
    ceilingHeight       = 2.8,
    falseCeiling        = 0.3,
    workingPlane        = 0.8,
    targetLux           = 300,
    ceilingReflectance  = 0.7,
    wallReflectance     = 0.5,
    floorReflectance    = 0.2,
  } = activeRoom.room ?? {}
  const roomWidth  = Number(roomWidthRaw)
  const roomHeight = Number(roomHeightRaw)
  const areaM2     = (roomWidth / 1000) * (roomHeight / 1000)
  const totalLumens = lights.reduce((s, l) => s + l.lumens, 0)
  const mh         = Number(ceilingHeight) - Number(falseCeiling) - Number(workingPlane)
  const wm = roomWidth / 1000, hm = roomHeight / 1000
  const rcr = wm > 0 && hm > 0 ? (5 * mh * (wm + hm)) / (wm * hm) : 0
  const avgRef = (Number(ceilingReflectance) + Number(wallReflectance) + Number(floorReflectance)) / 3
  const ufRaw  = avgRef >= 0.6 ? 1 - rcr * 0.04 : avgRef >= 0.4 ? 1 - rcr * 0.055 : 1 - rcr * 0.07
  const uf     = Math.min(0.95, Math.max(0.4, ufRaw))
  const totalLux = areaM2 === 0 ? 0 : (totalLumens * uf * 0.8) / areaM2

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#090c10", overflow: "hidden" }}>

      {/* Header */}
      <header style={{
        height: 48, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", background: "#0d1117", borderBottom: "1px solid #1a2b3c",
        color: "#cdd9e5", fontFamily: "IBM Plex Mono", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 3,
            background: "linear-gradient(135deg, #1e4a6e 0%, #39c5cf 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: "#fff", fontWeight: 600,
          }}>L</div>
          <span style={{ color: "#4a7a96" }}>LUMINA DESIGN</span>
          <span style={{ color: "#1a2b3c" }}>·</span>
          <span style={{
            padding: "2px 8px", background: "#1a0e2a",
            border: "1px solid #7c3aed", borderRadius: 3,
            color: "#a78bfa", fontSize: 9, letterSpacing: "0.1em",
          }}>SHARED VIEW</span>
          <span style={{ color: "#cdd9e5", fontSize: 12 }}>{projectName}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowReport(true)}
            style={{
              padding: "5px 14px", background: "transparent",
              border: "1px solid #1a2b3c", borderRadius: 3,
              color: "#4a7a96", fontFamily: "IBM Plex Mono", fontSize: 10,
              letterSpacing: "0.08em", cursor: "pointer",
            }}
          >View Report</button>
          <div style={{ fontSize: 12, color: "#39c5cf" }}>Canvas v0.2</div>
        </div>
      </header>

      {/* Floor tabs (read-only) */}
      <div style={{
        height: 32, display: "flex", alignItems: "center",
        padding: "0 20px", background: "#0a1018",
        borderBottom: "1px solid #131d28", flexShrink: 0,
        fontFamily: "IBM Plex Mono", fontSize: 10, gap: 8,
      }}>
        {floors.map(f => (
          <button key={f.id}
            onClick={() => { setActiveFloorId(f.id); setActiveRoomId(f.rooms[0].id) }}
            style={{
              padding: "3px 10px",
              background: f.id === activeFloorId ? "#2a1e0e" : "transparent",
              border: `1px solid ${f.id === activeFloorId ? "#e8a830" : "#1a2b3c"}`,
              borderRadius: "3px 3px 0 0",
              color: f.id === activeFloorId ? "#e8a830" : "#4a7a96",
              fontFamily: "IBM Plex Mono", fontSize: 10, cursor: "pointer",
            }}
          >{f.name}</button>
        ))}
        <span style={{ color: "#1a2b3c", margin: "0 8px" }}>|</span>
        {activeFloor.rooms.map(r => (
          <button key={r.id}
            onClick={() => setActiveRoomId(r.id)}
            style={{
              padding: "3px 10px",
              background: r.id === activeRoomId ? "#0e2a3a" : "transparent",
              border: `1px solid ${r.id === activeRoomId ? "#39c5cf" : "#1a2b3c"}`,
              borderRadius: "3px 3px 0 0",
              color: r.id === activeRoomId ? "#39c5cf" : "#4a7a96",
              fontFamily: "IBM Plex Mono", fontSize: 10, cursor: "pointer",
            }}
          >{r.name}</button>
        ))}
      </div>

      {/* Canvas */}
      <main style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden", alignItems: "flex-start", justifyContent: "center", padding: "16px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, overflowY: "auto", maxHeight: "100%" }}>
          <DesignCanvas
            lights={lights}
            onAddLight={() => {}}
            onMoveLight={() => {}}
            onDeleteLight={() => {}}
            lux={totalLux}
            roomWidth={roomWidth}
            roomHeight={roomHeight}
            snapToGrid={false}
            rcr={rcr}
            uf={uf}
            targetLux={Number(targetLux)}
            activeTool="fixture"
            dbMarkers={activeRoom.dbMarkers ?? []}
            ctrMarkers={activeRoom.ctrMarkers ?? []}
            jbMarkers={activeRoom.jbMarkers ?? []}
            onAddMarker={() => {}}
            onMoveMarker={() => {}}
            onDeleteMarker={() => {}}
            floorPlan={activeRoom.floorPlan ?? null}
          />
        </div>
      </main>

      {/* Watermark */}
      <div style={{
        height: 28, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a1018", borderTop: "1px solid #131d28",
        fontFamily: "IBM Plex Mono", fontSize: 9, color: "#1a2b3c", letterSpacing: "0.12em",
        flexShrink: 0,
      }}>
        POWERED BY LUMINA DESIGN
      </div>

      {showReport && (
        <ReportPanel
          floors={floors}
          projectName={projectName}
          onClose={() => setShowReport(false)}
          daliEnabled={daliEnabled}
          daliAddresses={null}
          busCableLengths={{}}
          busTopologies={busTopologies}
        />
      )}
    </div>
  )
}
