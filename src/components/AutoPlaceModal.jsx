import React, { useState, useMemo } from 'react'
import { CONFIGURABLE_FIXTURES } from '../data/configurable-fixtures'

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

const PURPOSE_OPTIONS = [
  { id: 'ambient', label: 'Ambient', icon: '💡' },
  { id: 'task', label: 'Task', icon: '🎯' },
  { id: 'accent', label: 'Accent', icon: '✨' },
  { id: 'wall-wash', label: 'Wall Wash', icon: '🌊' },
  { id: 'mood', label: 'Mood', icon: '🎨' },
]

const CATEGORY_OPTIONS = [
  { id: 'cob-downlight', label: 'COB Downlight' },
  { id: 'smd-downlight', label: 'SMD Downlight' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'panel-light', label: 'Panel Light' },
  { id: 'track-light', label: 'Track Light' },
  { id: 'linear', label: 'Linear' },
  { id: 'auto', label: 'Auto Recommend' },
]

const PURPOSE_TO_CATEGORY = {
  'ambient': ['cob-downlight', 'smd-downlight', 'panel-light'],
  'task': ['cob-downlight', 'spotlight', 'panel-light'],
  'accent': ['spotlight', 'track-light'],
  'wall-wash': ['track-light', 'linear'],
  'mood': ['linear', 'spotlight'],
}

export default function AutoPlaceModal({ room = {}, ceilingHeight = 2700, roomArea_m2 = 0, onPlace, onClose }) {
  const [step, setStep] = useState(1)
  const [selectedPurposes, setSelectedPurposes] = useState(new Set(['ambient']))
  const [selectedCategory, setSelectedCategory] = useState('auto')

  const togglePurpose = (id) => {
    const updated = new Set(selectedPurposes)
    if (updated.has(id)) {
      if (updated.size > 1) updated.delete(id)
    } else {
      updated.add(id)
    }
    setSelectedPurposes(updated)
  }

  const recommendedFixture = useMemo(() => {
    if (selectedCategory === 'auto') {
      const purposes = Array.from(selectedPurposes)
      const recommendedCats = new Set()
      purposes.forEach(p => {
        const cats = PURPOSE_TO_CATEGORY[p] || []
        cats.forEach(c => recommendedCats.add(c))
      })
      const cats = Array.from(recommendedCats)
      const fixtureId = cats.length > 0 ? cats[0] : 'cob-downlight'
      return CONFIGURABLE_FIXTURES.find(f => f.id === fixtureId)
    }
    return CONFIGURABLE_FIXTURES.find(f => f.id === selectedCategory)
  }, [selectedPurposes, selectedCategory])

  const preview = useMemo(() => {
    if (!recommendedFixture) return null
    const roomType = room.roomType || 'Living Room'
    const intel = ROOM_INTELLIGENCE_MAP[roomType] || ROOM_INTELLIGENCE_MAP['Living Room']
    const spacing = intel.spacing, targetLux = intel.targetLux
    const powerOptions = recommendedFixture.powerOptions || [12, 15, 20]
    let wattage = ceilingHeight < 2500 ? powerOptions[0] : ceilingHeight > 3500 ? powerOptions[powerOptions.length - 1] : powerOptions[Math.floor(powerOptions.length / 2)]
    const beamOptions = recommendedFixture.beamOptions || [{ angle: 36 }, { angle: 60 }]
    let beamAngle = selectedPurposes.has('accent') ? (beamOptions[0]?.angle || 36) : selectedPurposes.has('wall-wash') ? (beamOptions[beamOptions.length - 1]?.angle || 60) : (beamOptions[Math.floor(beamOptions.length / 2)]?.angle || 45)
    const quantity = Math.ceil(Math.sqrt(roomArea_m2) / spacing)
    const defaultChip = recommendedFixture.chipOptions ? recommendedFixture.chipOptions[0] : null
    const lumens = recommendedFixture.calculateLumens ? recommendedFixture.calculateLumens(wattage, defaultChip) : wattage * 100
    const MAINT_FACTOR = 0.8, UF = 0.75, totalLumens = lumens * quantity
    const estimatedLux = roomArea_m2 > 0 ? Math.round((totalLumens * UF * MAINT_FACTOR) / roomArea_m2) : 0
    const compliant = estimatedLux >= targetLux
    return { fixture: recommendedFixture, wattage, beamAngle, quantity, lumens, spacing, targetLux, estimatedLux, compliant }
  }, [recommendedFixture, selectedPurposes, ceilingHeight, room.roomType, roomArea_m2])

  const handlePlace = () => {
    if (preview && onPlace) {
      onPlace({ fixture: preview.fixture, wattage: preview.wattage, beamAngle: preview.beamAngle, quantity: preview.quantity, purposes: Array.from(selectedPurposes) })
    }
    onClose?.()
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '8px', width: '500px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'IBM Plex Mono', color: '#cdd9e5' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#d4a843', letterSpacing: '1px', textTransform: 'uppercase' }}>Auto Place Fixtures</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#666', cursor: 'pointer', padding: '0' }}>X</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {step === 1 && (<div><div style={{ fontSize: '12px', color: '#d4a843', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Step 1: Lighting Purpose</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>{PURPOSE_OPTIONS.map(p => (<button key={p.id} onClick={() => togglePurpose(p.id)} style={{ padding: '16px', backgroundColor: selectedPurposes.has(p.id) ? 'rgba(212,168,67,0.15)' : '#1a1a1a', border: selectedPurposes.has(p.id) ? '1px solid #d4a843' : '1px solid #2a2a2a', borderRadius: '6px', color: selectedPurposes.has(p.id) ? '#d4a843' : '#cdd9e5', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'IBM Plex Mono', textAlign: 'center' }}><div style={{ fontSize: '18px', marginBottom: '6px' }}>{p.icon}</div><div>{p.label}</div></button>))}</div></div>)}
          {step === 2 && (<div><div style={{ fontSize: '12px', color: '#d4a843', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Step 2: Fixture Category</div><div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{CATEGORY_OPTIONS.map(c => (<button key={c.id} onClick={() => setSelectedCategory(c.id)} style={{ padding: '12px', backgroundColor: selectedCategory === c.id ? 'rgba(212,168,67,0.15)' : '#1a1a1a', border: selectedCategory === c.id ? '1px solid #d4a843' : '1px solid #2a2a2a', borderRadius: '4px', color: selectedCategory === c.id ? '#d4a843' : '#cdd9e5', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'IBM Plex Mono', textAlign: 'left' }}>{c.label}</button>))}</div></div>)}
          {step === 3 && preview && (<div><div style={{ fontSize: '12px', color: '#d4a843', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Step 3: Review & Place</div><div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '6px', border: '1px solid #2a2a2a', marginBottom: '16px' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}><div><div style={{ color: '#666', marginBottom: '4px' }}>Fixture</div><div style={{ color: '#d4a843', fontWeight: 600 }}>{preview.fixture.name}</div></div><div><div style={{ color: '#666', marginBottom: '4px' }}>Wattage</div><div style={{ color: '#d4a843', fontWeight: 600 }}>{preview.wattage}W</div></div><div><div style={{ color: '#666', marginBottom: '4px' }}>Beam</div><div style={{ color: '#d4a843', fontWeight: 600 }}>{preview.beamAngle}°</div></div><div><div style={{ color: '#666', marginBottom: '4px' }}>Qty</div><div style={{ color: '#d4a843', fontWeight: 600 }}>{preview.quantity}</div></div><div><div style={{ color: '#666', marginBottom: '4px' }}>Spacing</div><div style={{ color: '#d4a843', fontWeight: 600 }}>{preview.spacing.toFixed(1)}m</div></div><div><div style={{ color: '#666', marginBottom: '4px' }}>Lumens</div><div style={{ color: '#d4a843', fontWeight: 600 }}>{preview.lumens}</div></div></div></div><div style={{ backgroundColor: '#111', padding: '12px', borderRadius: '6px', border: '1px solid ' + (preview.compliant ? '#3dba74' : '#ff6b6b'), marginBottom: '16px' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}><span style={{ color: '#666' }}>Target</span><span>{preview.targetLux}lx</span></div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#666' }}>Est</span><span style={{ color: preview.compliant ? '#3dba74' : '#ff6b6b', fontWeight: 600 }}>{preview.estimatedLux}lx {preview.compliant ? 'OK' : 'LOW'}</span></div></div></div>)}
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2a2a', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {step > 1 && <button onClick={() => setStep(step - 1)} style={{ padding: '8px 16px', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: '#cdd9e5', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', fontWeight: 600, fontFamily: 'IBM Plex Mono' }}>BACK</button>}
          <button onClick={onClose} style={{ padding: '8px 16px', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: '#cdd9e5', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', fontWeight: 600, fontFamily: 'IBM Plex Mono' }}>CANCEL</button>
          {step < 3 && <button onClick={() => setStep(step + 1)} style={{ padding: '8px 16px', backgroundColor: '#d4a843', border: 'none', color: '#000', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', fontWeight: 700, fontFamily: 'IBM Plex Mono' }}>NEXT</button>}
          {step === 3 && <button onClick={handlePlace} style={{ padding: '8px 16px', backgroundColor: '#d4a843', border: 'none', color: '#000', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', fontWeight: 700, fontFamily: 'IBM Plex Mono' }}>PLACE</button>}
        </div>
      </div>
    </div>
  )
}
