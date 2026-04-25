import { useState, useMemo } from 'react'
import { SPACE_TYPES, LAYER_META, generateLightingDesign } from '../utils/lightingDesignEngine'

const mono = { fontFamily: 'IBM Plex Mono, monospace' }

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Tag({ children, color = '#444444' }) {
  return (
    <span style={{
      ...mono, fontSize: 7, padding: '2px 6px', borderRadius: 10,
      border: `1px solid ${color}44`, color, letterSpacing: '0.06em',
    }}>{children}</span>
  )
}

function StepDot({ n, label, active, done }) {
  const col = done ? '#3dba74' : active ? '#d4a843' : '#444444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: done ? '#0e2018' : active ? '#1e1800' : '#0d0d0d',
        border: `2px solid ${col}`,
        ...mono, fontSize: 10, fontWeight: 700, color: col, flexShrink: 0,
      }}>{done ? '✓' : n}</div>
      <span style={{ ...mono, fontSize: 9, color: col, letterSpacing: '0.06em' }}>{label}</span>
    </div>
  )
}

function LayerCard({ layer }) {
  const meta = LAYER_META[layer.type] || LAYER_META.ambient
  const isStrip = layer.type === 'cove' || layer.type === 'task'
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 14px', borderRadius: 5,
      background: `${meta.color}0a`,
      border: `1px solid ${meta.color}30`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 4, flexShrink: 0,
        background: `${meta.color}18`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: meta.color,
      }}>{meta.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ ...mono, fontSize: 9, fontWeight: 700, color: meta.color, letterSpacing: '0.06em' }}>
            {layer.label}
          </span>
          <span style={{ ...mono, fontSize: 7, color: '#444444', padding: '1px 5px', border: '1px solid #222222', borderRadius: 3 }}>
            {meta.label.toUpperCase()}
          </span>
        </div>
        {isStrip ? (
          <div style={{ ...mono, fontSize: 9, color: '#8abfd4' }}>
            {layer.wattPerMeter} W/m · perimeter strip
          </div>
        ) : (
          <div style={{ ...mono, fontSize: 9, color: '#8abfd4' }}>
            {layer.fixture?.name} · {layer.watt}W · {layer.beamAngle}° beam
          </div>
        )}
      </div>
    </div>
  )
}

// ── Step 1: Space type ────────────────────────────────────────────────────────
function StepSpace({ selected, onSelect }) {
  const categories = [...new Set(SPACE_TYPES.map(s => s.category))]
  return (
    <div>
      <div style={{ ...mono, fontSize: 9, color: '#ffffff', marginBottom: 14, letterSpacing: '0.1em' }}>
        SELECT SPACE TYPE — we'll design a full lighting scheme for it
      </div>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ ...mono, fontSize: 8, color: '#444444', letterSpacing: '0.12em', marginBottom: 8 }}>
            {cat.toUpperCase()}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {SPACE_TYPES.filter(s => s.category === cat).map(s => {
              const isSel = selected === s.id
              return (
                <div key={s.id} onClick={() => onSelect(s.id)} style={{
                  padding: '12px 8px', borderRadius: 5, cursor: 'pointer', textAlign: 'center',
                  background: isSel ? '#111111' : '#0a0a0a',
                  border: `1px solid ${isSel ? '#d4a843' : '#222222'}`,
                  transition: 'all 0.12s',
                  boxShadow: isSel ? '0 0 0 1px #d4a84330' : 'none',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 5, lineHeight: 1 }}>{s.icon}</div>
                  <div style={{ ...mono, fontSize: 9, fontWeight: isSel ? 700 : 400, color: isSel ? '#d4a843' : '#6a8aaa', letterSpacing: '0.05em', marginBottom: 3 }}>
                    {s.name}
                  </div>
                  <div style={{ ...mono, fontSize: 7, color: '#444444' }}>{s.targetLux} lx · {s.cct}</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {selected && (() => {
        const space = SPACE_TYPES.find(s => s.id === selected)
        return (
          <div style={{
            marginTop: 4, padding: '12px 16px', borderRadius: 5,
            background: '#0d0d0d', border: '1px solid #222222',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>{space.icon}</span>
              <div>
                <div style={{ ...mono, fontSize: 11, fontWeight: 700, color: '#d4a843', marginBottom: 4 }}>
                  {space.name}
                </div>
                <div style={{ ...mono, fontSize: 9, color: '#8abfd4', lineHeight: 1.6, marginBottom: 8 }}>
                  {space.description}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {space.tags.map(t => <Tag key={t} color='#ffffff'>{t}</Tag>)}
                  <Tag color='#3dba74'>{space.standard}</Tag>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Step 2: Room config ───────────────────────────────────────────────────────
function StepRoom({ space, roomW, roomL, ceilH, onChangeW, onChangeL, onChangeCeilH }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
      {/* Inputs */}
      <div>
        <div style={{ ...mono, fontSize: 9, color: '#ffffff', marginBottom: 16, letterSpacing: '0.1em' }}>
          ROOM DIMENSIONS
        </div>
        {[
          { label: 'WIDTH',           val: roomW,  set: onChangeW,    unit: 'm', min: 1, max: 100, step: 0.5 },
          { label: 'LENGTH',          val: roomL,  set: onChangeL,    unit: 'm', min: 1, max: 100, step: 0.5 },
          { label: 'CEILING HEIGHT',  val: ceilH,  set: onChangeCeilH,unit: 'm', min: 2, max: 12,  step: 0.1 },
        ].map(({ label, val, set, unit, min, max, step }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ ...mono, fontSize: 8, color: '#444444', marginBottom: 5, letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number" value={val} min={min} max={max} step={step}
                onChange={e => set(parseFloat(e.target.value) || 0)}
                style={{
                  ...mono, width: 90, fontSize: 14, fontWeight: 700,
                  background: '#0d0d0d', color: '#cccccc',
                  border: '1px solid #222222', borderRadius: 3, padding: '6px 10px',
                }}
              />
              <span style={{ ...mono, fontSize: 10, color: '#ffffff' }}>{unit}</span>
            </div>
          </div>
        ))}

        {/* Room summary */}
        <div style={{
          marginTop: 8, padding: '10px 12px', borderRadius: 4,
          background: '#0d0d0d', border: '1px solid #222222',
        }}>
          <div style={{ ...mono, fontSize: 8, color: '#444444', marginBottom: 6, letterSpacing: '0.08em' }}>ROOM SUMMARY</div>
          {[
            ['Area',  `${(roomW * roomL).toFixed(1)} m²`],
            ['RCR',   (() => {
              const ri = (roomW * roomL) / (ceilH * (roomW + roomL))
              return `${(5 / ri).toFixed(2)}`
            })()],
            ['Target', `${space.targetLux} lx (${space.standard})`],
            ['CCT',    `${space.cct} · CRI ${space.cri}+`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ ...mono, fontSize: 8, color: '#444444' }}>{k}</span>
              <span style={{ ...mono, fontSize: 8, color: '#6a8aaa' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Design brief */}
      <div>
        <div style={{ ...mono, fontSize: 9, color: '#ffffff', marginBottom: 16, letterSpacing: '0.1em' }}>
          LIGHTING DESIGN BRIEF — {space.name.toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {space.layers.map((layer, i) => (
            <LayerCard key={i} layer={layer} />
          ))}
        </div>
        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 4,
          background: '#0d0d0d', border: '1px solid #222222',
        }}>
          <div style={{ ...mono, fontSize: 8, color: '#444444', marginBottom: 6, letterSpacing: '0.08em' }}>WHY THIS SCHEME?</div>
          <div style={{ ...mono, fontSize: 9, color: '#8abfd4', lineHeight: 1.7 }}>
            {space.description}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Preview ───────────────────────────────────────────────────────────
function StepPreview({ design, space }) {
  if (!design) return null
  const { layers, totalW, estimatedLux, compliance, complianceColor, area } = design

  return (
    <div>
      {/* Summary hero */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20,
        padding: '16px 20px', borderRadius: 6,
        background: '#0d0d0d', border: '1px solid #222222',
      }}>
        {[
          { label: 'EST. AVERAGE LUX', val: `${estimatedLux}`, unit: 'lx', color: '#d4a843' },
          { label: 'TARGET LUX',       val: `${space.targetLux}`, unit: 'lx', color: '#ffffff' },
          { label: 'TOTAL LOAD',       val: `${totalW}`, unit: 'W', color: '#6ae5ff' },
          { label: 'COVERAGE',         val: `${area.toFixed(1)}`, unit: 'm²', color: '#a78bfa' },
        ].map(({ label, val, unit, color }) => (
          <div key={label}>
            <div style={{ ...mono, fontSize: 7, color: '#444444', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
            <div style={{ ...mono, fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>
              {val} <span style={{ fontSize: 11, fontWeight: 400 }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          padding: '5px 14px', borderRadius: 14,
          background: `${complianceColor}18`, border: `1px solid ${complianceColor}55`,
          ...mono, fontSize: 10, fontWeight: 700, color: complianceColor, letterSpacing: '0.1em',
        }}>
          {compliance === 'COMPLIANT' ? '✓' : compliance === 'OVERLIT' ? '⚠' : '✗'} {compliance}
        </div>
        <span style={{ ...mono, fontSize: 9, color: '#444444' }}>
          {compliance === 'COMPLIANT' ? `Meets ${space.standard}` :
           compliance === 'OVERLIT'   ? 'Above target — consider dimming' :
           compliance === 'ACCEPTABLE'? 'Within ±20% of target' :
                                        `Below ${space.targetLux} lx target — add fixtures`}
        </span>
      </div>

      {/* Layer breakdown */}
      <div style={{ ...mono, fontSize: 9, color: '#ffffff', marginBottom: 12, letterSpacing: '0.1em' }}>
        LAYER BREAKDOWN — {layers.length} layer{layers.length !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {layers.map((layer, i) => {
          const meta = LAYER_META[layer.type] || LAYER_META.ambient
          const isStrip = layer.type === 'cove' || layer.type === 'task'
          const luxContrib = Math.round((layer.actualLm * design.UF * design.MF) / area)
          const pct = Math.round((layer.totalW / totalW) * 100)
          return (
            <div key={i} style={{
              padding: '12px 16px', borderRadius: 5,
              background: `${meta.color}08`, border: `1px solid ${meta.color}28`,
              display: 'grid', gridTemplateColumns: '28px 1fr auto auto auto', gap: 12, alignItems: 'center',
            }}>
              <div style={{ fontSize: 18, color: meta.color, textAlign: 'center' }}>{meta.icon}</div>
              <div>
                <div style={{ ...mono, fontSize: 10, fontWeight: 700, color: meta.color, marginBottom: 2 }}>
                  {layer.label}
                </div>
                {isStrip ? (
                  <div style={{ ...mono, fontSize: 8, color: '#6a8aaa' }}>
                    {layer.lenM?.toFixed(1)} m · {layer.wattPerMeter} W/m
                  </div>
                ) : (
                  <div style={{ ...mono, fontSize: 8, color: '#6a8aaa' }}>
                    {layer.fixture?.name} · {layer.watt}W · {layer.beamAngle}° beam
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: '#cccccc' }}>
                  {isStrip ? `${layer.lenM?.toFixed(1)}m` : layer.count}
                </div>
                <div style={{ ...mono, fontSize: 7, color: '#444444' }}>{isStrip ? 'strip' : 'fixtures'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: '#6ae5ff' }}>~{luxContrib}</div>
                <div style={{ ...mono, fontSize: 7, color: '#444444' }}>lx contrib</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>{Math.round(layer.totalW)}W</div>
                <div style={{ ...mono, fontSize: 7, color: '#444444' }}>{pct}% load</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Standards note */}
      <div style={{ ...mono, fontSize: 8, color: '#444444', padding: '8px 12px', border: '1px solid #1a1a1a', borderRadius: 3 }}>
        Calculation: Lumen Method · UF 0.65 · MF 0.80 · {space.standard} · CCT {space.cct} · CRI {space.cri}+
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function AutoPlaceModal({
  onPlace, onClose,
  roomW_m: defaultW, roomL_m: defaultL,
  ceilingHeight,
  roomX, roomY, roomPxW, roomPxH, pxPerMeter,
}) {
  const [step, setStep]   = useState(1)
  const [spaceId, setSpaceId] = useState(null)
  const [roomW,   setRoomW]   = useState(defaultW || 6)
  const [roomL,   setRoomL]   = useState(defaultL || 4)
  const [ceilH,   setCeilH]   = useState((ceilingHeight || 2700) / 1000)

  const space  = SPACE_TYPES.find(s => s.id === spaceId)

  const design = useMemo(() => {
    if (!space) return null
    return generateLightingDesign(
      space, roomW, roomL, ceilH,
      roomX, roomY, roomPxW, roomPxH, pxPerMeter
    )
  }, [space, roomW, roomL, ceilH, roomX, roomY, roomPxW, roomPxH, pxPerMeter])

  const STEPS = ['SPACE', 'ROOM', 'DESIGN']

  const handleNext = () => {
    if (step === 1 && !spaceId) return
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handlePlace = () => {
    if (!design || !space) return
    onPlace({ layers: design.layers, space, pxPerMeter })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#0a0a0a', border: '1px solid #222222', borderRadius: 8,
        width: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.9)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid #222222', flexShrink: 0,
        }}>
          <div>
            <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: '#d4a843', letterSpacing: '0.1em', marginBottom: 6 }}>
              ⚡ SMART LIGHTING DESIGN
            </div>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {STEPS.map((s, i) => (
                <>
                  <StepDot key={s} n={i+1} label={s} active={step === i+1} done={step > i+1} />
                  {i < STEPS.length - 1 && (
                    <div key={`line-${i}`} style={{ width: 28, height: 1, background: step > i+1 ? '#3dba74' : '#222222' }} />
                  )}
                </>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{
            ...mono, background: 'transparent', border: 'none', color: '#ffffff', fontSize: 18, cursor: 'pointer', lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {step === 1 && <StepSpace selected={spaceId} onSelect={setSpaceId} />}
          {step === 2 && space && (
            <StepRoom
              space={space}
              roomW={roomW} roomL={roomL} ceilH={ceilH}
              onChangeW={setRoomW} onChangeL={setRoomL} onChangeCeilH={setCeilH}
            />
          )}
          {step === 3 && design && <StepPreview design={design} space={space} />}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px', borderTop: '1px solid #222222', flexShrink: 0,
          background: '#0a0a0a',
        }}>
          <div style={{ ...mono, fontSize: 8, color: '#444444' }}>
            {step === 1 && 'Select a space type to continue'}
            {step === 2 && space && `${space.name} · ${space.layers.length} lighting layers`}
            {step === 3 && design && `${design.layers.reduce((s,l)=>s+(l.count||0),0)} fixtures + strips · ${design.totalW} W total`}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 1 && (
              <button onClick={handleBack} style={{
                ...mono, padding: '8px 18px', background: 'transparent',
                color: '#ffffff', border: '1px solid #222222', borderRadius: 4, cursor: 'pointer', fontSize: 10,
              }}>← BACK</button>
            )}
            <button onClick={onClose} style={{
              ...mono, padding: '8px 18px', background: 'transparent',
              color: '#ffffff', border: '1px solid #222222', borderRadius: 4, cursor: 'pointer', fontSize: 10,
            }}>CANCEL</button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={step === 1 && !spaceId}
                style={{
                  ...mono, padding: '8px 22px', fontSize: 10, fontWeight: 700,
                  background: (step === 1 && !spaceId) ? '#1a1a1a' : '#d4a843',
                  color:      (step === 1 && !spaceId) ? '#444444' : '#0f0f0f',
                  border: 'none', borderRadius: 4,
                  cursor: (step === 1 && !spaceId) ? 'default' : 'pointer',
                }}
              >NEXT →</button>
            ) : (
              <button onClick={handlePlace} style={{
                ...mono, padding: '8px 24px', fontSize: 10, fontWeight: 700,
                background: '#d4a843', color: '#0f0f0f',
                border: 'none', borderRadius: 4, cursor: 'pointer',
              }}>⚡ PLACE DESIGN</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
