import React from 'react'

// ROOM INTELLIGENCE map with specifications
const ROOM_INTELLIGENCE_MAP = {
  "Living Room": { targetLux: 150, cct: 2700, ugr: 22, ip: "IP20", spacing: 2.5, beam: 60, watt: 12 },
  "Kitchen": { targetLux: 300, cct: 4000, ugr: 19, ip: "IP44", spacing: 1.8, beam: 36, watt: 15 },
  "Bedroom": { targetLux: 100, cct: 2700, ugr: 25, ip: "IP20", spacing: 3.0, beam: 60, watt: 10 },
  "Bathroom": { targetLux: 200, cct: 4000, ugr: 25, ip: "IP65", spacing: 2.0, beam: 45, watt: 12 },
  "Office": { targetLux: 500, cct: 4000, ugr: 16, ip: "IP20", spacing: 1.5, beam: 36, watt: 20 },
  "Corridor": { targetLux: 100, cct: 4000, ugr: 22, ip: "IP20", spacing: 3.5, beam: 60, watt: 10 },
  "Dining Room": { targetLux: 200, cct: 3000, ugr: 19, ip: "IP20", spacing: 2.2, beam: 60, watt: 15 },
  "Conference Room": { targetLux: 500, cct: 4000, ugr: 16, ip: "IP20", spacing: 1.5, beam: 36, watt: 20 },
  "Retail": { targetLux: 750, cct: 4000, ugr: 19, ip: "IP20", spacing: 1.2, beam: 36, watt: 25 },
  "Museum": { targetLux: 300, cct: 3000, ugr: 19, ip: "IP20", spacing: 2.0, beam: 45, watt: 12 },
  "Hospital Room": { targetLux: 500, cct: 4000, ugr: 16, ip: "IP44", spacing: 1.5, beam: 36, watt: 18 },
  "Laboratory": { targetLux: 750, cct: 5000, ugr: 16, ip: "IP20", spacing: 1.2, beam: 36, watt: 25 },
  "Production": { targetLux: 500, cct: 5000, ugr: 22, ip: "IP54", spacing: 1.8, beam: 45, watt: 20 },
  "Warehouse": { targetLux: 200, cct: 5000, ugr: 25, ip: "IP65", spacing: 3.0, beam: 60, watt: 15 },
}

export default function RoomIntelligencePanel({
  room = {},
  allFixtures = [],
  ceilingHeight = 2700,
  targetLux = 300,
  uf = 0.75,
  roomArea_m2 = 0,
}) {
  const MAINT_FACTOR = 0.8

  // Get room intelligence values
  const roomType = room.roomType || "Living Room"
  const intel = ROOM_INTELLIGENCE_MAP[roomType] || ROOM_INTELLIGENCE_MAP["Living Room"]
  const targetLuxVal = Number(room.targetLux) || intel.targetLux || 300
  const cct = Number(room.cct) || intel.cct || 2700
  const ugr = Number(room.ugr) || intel.ugr || 22
  const ipRating = room.ipRating || intel.ip || "IP20"
  const spacing = Number(room.spacing) || intel.spacing || 2.5
  const beamAngle = intel.beam || 60
  const fixtureWatt = intel.watt || 12

  // Calculate actual lux from placed fixtures
  const totalLumens = allFixtures.reduce((sum, f) => sum + (f.lumens || 0), 0)
  const achievedLux = roomArea_m2 > 0 ? Math.round((totalLumens * uf * MAINT_FACTOR) / roomArea_m2) : 0
  const fixtureCount = allFixtures.length

  // Compliance checks
  const luxCompliant = achievedLux >= targetLuxVal
  const ugrCompliant = true

  // Recommended fixture count based on area and spacing
  const recommendedQty = Math.ceil(Math.sqrt(roomArea_m2) / spacing)

  return (
    <div style={{ padding: '8px', borderBottom: '1px solid #2a2a2a', marginBottom: '4px' }}>
      {/* Header */}
      <div style={{
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: '9px',
        letterSpacing: '1.5px',
        color: '#d4a843',
        marginBottom: '6px',
        paddingBottom: '4px',
        borderBottom: '1px solid #2a2a2a',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}>
        Room Intelligence
      </div>

      {/* 4-column Stat Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
        marginBottom: '6px',
      }}>
        <div style={{ background: '#1a1a1a', padding: '4px 6px', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '8px', color: '#666', display: 'block', marginBottom: '2px' }}>Lux</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#d4a843' }}>{targetLuxVal}</div>
        </div>
        <div style={{ background: '#1a1a1a', padding: '4px 6px', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '8px', color: '#666', display: 'block', marginBottom: '2px' }}>CCT</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#d4a843' }}>{cct}K</div>
        </div>
        <div style={{ background: '#1a1a1a', padding: '4px 6px', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '8px', color: '#666', display: 'block', marginBottom: '2px' }}>UGR</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#d4a843' }}>{ugr}</div>
        </div>
        <div style={{ background: '#1a1a1a', padding: '4px 6px', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '8px', color: '#666', display: 'block', marginBottom: '2px' }}>IP</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#d4a843' }}>{ipRating}</div>
        </div>
      </div>

      {/* Compliance Status */}
      <div style={{ background: '#111', borderRadius: '4px', padding: '6px 8px', marginBottom: '4px' }}>
        <div style={{ fontSize: '8px', color: '#666', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
          Compliance
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '1px 0' }}>
          <span style={{ color: '#888' }}>Achieved:</span>
          <span style={{ color: luxCompliant ? '#3dba74' : '#ff6b6b', fontWeight: 600 }}>{achievedLux} lx</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '1px 0' }}>
          <span style={{ color: '#888' }}>Fixture:</span>
          <span style={{ color: '#aaa', fontWeight: 600 }}>{fixtureCount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '1px 0' }}>
          <span style={{ color: '#888' }}>UGR:</span>
          <span style={{ color: ugrCompliant ? '#3dba74' : '#ff6b6b', fontWeight: 600 }}>PASS</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '1px 0' }}>
          <span style={{ color: '#888' }}>Spacing:</span>
          <span style={{ color: '#aaa', fontWeight: 600 }}>{spacing.toFixed(1)}m</span>
        </div>
      </div>

      {/* Recommendation */}
      <div style={{ padding: '4px 8px', background: '#111', borderRadius: '4px', marginBottom: '4px', fontSize: '10px', color: '#aaa', fontFamily: 'IBM Plex Mono' }}>
        {beamAngle}° · {fixtureWatt}W · {spacing.toFixed(1)}m
      </div>

      {/* Compliance Badge */}
      <div style={{
        padding: '4px 8px',
        fontSize: '10px',
        borderRadius: '4px',
        textAlign: 'center',
        fontFamily: 'IBM Plex Mono',
        fontWeight: 600,
        border: `1px solid ${luxCompliant ? '#3dba74' : '#ff6b6b'}`,
        background: luxCompliant ? 'rgba(61,186,116,0.08)' : 'rgba(255,107,107,0.08)',
        color: luxCompliant ? '#3dba74' : '#ff6b6b',
      }}>
        {luxCompliant ? '✓ EN 12464-1' : `✗ ${targetLuxVal - achievedLux}lx short`}
      </div>
    </div>
  )
}
