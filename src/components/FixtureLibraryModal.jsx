import { useState, useEffect } from 'react'
import { CATEGORY_META, CATEGORY_VISUAL, resolveFixture } from '../data/fixtureLibrary'
import { getUserFixtures, saveUserFixture, updateUserFixture, deleteUserFixture } from '../firebase'

const CATEGORIES = ['COB_DOWNLIGHT', 'SPOTLIGHT', 'PANEL', 'LINEAR', 'WALL_WASHER', 'LED_STRIP']

const PROTOCOL_OPTIONS = [
  { value: 'Room Default', label: 'Room Default' },
  { value: 'NON-DIM',      label: 'Non-dim' },
  { value: 'PHASE-CUT',    label: 'Phase-cut (Triac)' },
  { value: '0-10V',        label: '0-10V Analog' },
  { value: 'DALI',         label: 'DALI' },
  { value: 'ZIGBEE',       label: 'Zigbee' },
]

const EMPTY_FORM = {
  name: '', category: 'COB_DOWNLIGHT', watt: '', lumens: '', beamAngle: '',
  cct: '3000K', tunable: false, brand: '', modelNumber: '', notes: '', voltage: 230,
  protocol: 'Room Default',
}

function defaultCardConfig(category) {
  const meta = CATEGORY_META[category]
  if (category === 'LED_STRIP') {
    return { beamAngle: 120, cct: '3000K', voltage: 24, wattPerMtr: 10, lumensPerMtr: 800, length: 1, protocol: 'Room Default' }
  }
  return { watt: meta.variants[0].watt, beamAngle: meta.beamAngles[0], cct: meta.cctOptions[0], protocol: 'Room Default' }
}

// ── Shared styled select ──────────────────────────────────────────────────────
function SelectRow({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontFamily: 'IBM Plex Mono', fontSize: 8, color: '#2d4f68',
        width: 64, flexShrink: 0, letterSpacing: '0.1em',
      }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1, background: '#070c12', border: '1px solid #1a2b3c', borderRadius: 3,
          color: '#cdd9e5', fontFamily: 'IBM Plex Mono', fontSize: 9, padding: '4px 6px',
          outline: 'none', cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function InputRow({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontFamily: 'IBM Plex Mono', fontSize: 8, color: '#2d4f68',
        width: 64, flexShrink: 0, letterSpacing: '0.1em',
      }}>{label}</span>
      <input
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1, background: '#070c12', border: '1px solid #1a2b3c', borderRadius: 3,
          color: '#cdd9e5', fontFamily: 'IBM Plex Mono', fontSize: 9, padding: '4px 6px',
          outline: 'none',
        }}
      />
    </div>
  )
}

// ── Standard library fixture card ─────────────────────────────────────────────
function CategoryCard({ category, config, onConfigChange, onSelect }) {
  if (!config) return null
  const meta    = CATEGORY_META[category]
  const vis     = CATEGORY_VISUAL[category]
  const isStrip = category === 'LED_STRIP'
  const variant = !isStrip ? (meta.variants.find(v => v.watt === config.watt) ?? meta.variants[0]) : null

  const displayWatt   = isStrip ? `${config.wattPerMtr ?? 0}W/m` : `${config.watt ?? 0}W`
  const displayLumens = isStrip ? `${config.lumensPerMtr ?? 0} lm/m` : `${variant?.lumens ?? 0} lm`

  return (
    <div style={{
      background: '#0a1018', border: '1px solid #1a2b3c', borderRadius: 6,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 11, height: 11, borderRadius: '50%', flexShrink: 0,
          background: vis.fill, border: `2px solid ${vis.stroke}`,
        }} />
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#cdd9e5', flex: 1 }}>
          {meta.label}
        </span>
        {config.cct === 'Tunable' && (
          <span style={{
            fontSize: 8, color: '#e8a830', border: '1px solid #e8a83066',
            borderRadius: 2, padding: '1px 5px', letterSpacing: '0.1em',
          }}>TUNABLE</span>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 14 }}>
        {[
          ['WATT',   displayWatt],
          ['LUMENS', displayLumens],
          ['BEAM',   `${config.beamAngle}°`],
          ['CCT',    config.cct],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 7, color: '#2d4f68', marginBottom: 3, letterSpacing: '0.1em' }}>{k}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4a7a96' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Selectors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {!isStrip && (
          <SelectRow
            label="WATTAGE"
            value={config.watt}
            onChange={v => onConfigChange({ watt: Number(v) })}
            options={meta.variants.map(v => ({ value: v.watt, label: `${v.watt}W — ${v.lumens} lm` }))}
          />
        )}
        <SelectRow
          label="BEAM"
          value={config.beamAngle}
          onChange={v => onConfigChange({ beamAngle: Number(v) })}
          options={meta.beamAngles.map(b => ({ value: b, label: `${b}°` }))}
        />
        <SelectRow
          label="CCT"
          value={config.cct}
          onChange={v => onConfigChange({ cct: v, tunable: v === 'Tunable' })}
          options={meta.cctOptions.map(c => ({ value: c, label: c }))}
        />
        <SelectRow
          label="PROTOCOL"
          value={config.protocol ?? 'Room Default'}
          onChange={v => onConfigChange({ protocol: v })}
          options={PROTOCOL_OPTIONS}
        />
        {isStrip && (
          <>
            <SelectRow
              label="VOLTAGE"
              value={config.voltage}
              onChange={v => onConfigChange({ voltage: Number(v) })}
              options={[12, 24, 48].map(v => ({ value: v, label: `${v}V` }))}
            />
            <InputRow label="W / MTR"  value={config.wattPerMtr}   onChange={v => onConfigChange({ wattPerMtr: Number(v) })}   placeholder="e.g. 10" />
            <InputRow label="LM / MTR" value={config.lumensPerMtr} onChange={v => onConfigChange({ lumensPerMtr: Number(v) })} placeholder="e.g. 800" />
            <InputRow label="LENGTH M" value={config.length}       onChange={v => onConfigChange({ length: Number(v) })}       placeholder="e.g. 2.4" />
          </>
        )}
      </div>

      {/* Select button */}
      <button
        onClick={onSelect}
        style={{
          padding: '8px', background: '#0a1e2e', border: `1px solid ${vis.stroke}66`,
          borderRadius: 4, color: vis.stroke, fontFamily: 'IBM Plex Mono',
          fontSize: 9, letterSpacing: '0.16em', cursor: 'pointer', textTransform: 'uppercase',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#0e2a3a'; e.currentTarget.style.borderColor = vis.stroke }}
        onMouseLeave={e => { e.currentTarget.style.background = '#0a1e2e'; e.currentTarget.style.borderColor = vis.stroke + '66' }}
      >
        Select
      </button>
    </div>
  )
}

// ── My Fixtures card ──────────────────────────────────────────────────────────
function MyFixtureCard({ fixture, onSelect, onEdit, onDelete }) {
  const vis = CATEGORY_VISUAL[fixture.category] ?? CATEGORY_VISUAL.COB_DOWNLIGHT
  const catMeta = CATEGORY_META[fixture.category]
  return (
    <div style={{
      background: '#0a1018', border: '1px solid #1a2b3c', borderRadius: 6,
      padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: vis.fill, border: `2px solid ${vis.stroke}` }} />
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#cdd9e5', flex: 1 }}>{fixture.name || 'Unnamed'}</span>
        {fixture.tunable && (
          <span style={{ fontSize: 8, color: '#e8a830', border: '1px solid #e8a83066', borderRadius: 2, padding: '1px 5px' }}>TUNABLE</span>
        )}
      </div>

      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 8, color: '#2d4f68' }}>
        {catMeta?.label ?? fixture.category}
        {fixture.brand ? ` · ${fixture.brand}` : ''}
        {fixture.modelNumber ? ` · ${fixture.modelNumber}` : ''}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {[
          ['WATT',   `${fixture.watt ?? 0}W`],
          ['LUMENS', `${fixture.lumens ?? 0} lm`],
          ['BEAM',   `${fixture.beamAngle ?? 0}°`],
          ['CCT',    fixture.cct ?? '—'],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 7, color: '#2d4f68', marginBottom: 2, letterSpacing: '0.1em' }}>{k}</div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4a7a96' }}>{v}</div>
          </div>
        ))}
      </div>

      {fixture.notes && (
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 8, color: '#2d4f68', fontStyle: 'italic', borderTop: '1px solid #131d28', paddingTop: 8 }}>
          {fixture.notes}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onSelect}
          style={{
            flex: 1, padding: '6px', background: '#0a1e2e', border: `1px solid ${vis.stroke}66`,
            borderRadius: 3, color: vis.stroke, fontFamily: 'IBM Plex Mono', fontSize: 9,
            letterSpacing: '0.14em', cursor: 'pointer', textTransform: 'uppercase',
          }}
        >Select</button>
        <button
          onClick={onEdit}
          style={{
            padding: '6px 10px', background: 'transparent', border: '1px solid #1a2b3c',
            borderRadius: 3, color: '#4a7a96', fontFamily: 'IBM Plex Mono', fontSize: 9, cursor: 'pointer',
          }}
        >Edit</button>
        <button
          onClick={onDelete}
          style={{
            padding: '6px 10px', background: 'transparent', border: '1px solid #1a2b3c',
            borderRadius: 3, color: '#4a4060', fontFamily: 'IBM Plex Mono', fontSize: 9, cursor: 'pointer',
          }}
        >Del</button>
      </div>
    </div>
  )
}

// ── Add / Edit form ───────────────────────────────────────────────────────────
function FixtureForm({ data, onChange, onSave, onCancel, saving, isEdit }) {
  const isStrip = data.category === 'LED_STRIP'
  const catMeta = CATEGORY_META[data.category]

  function field(key, label, type = 'text', placeholder = '') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 8, color: '#2d4f68', letterSpacing: '0.1em' }}>{label}</label>
        <input
          type={type}
          value={data[key] ?? ''}
          placeholder={placeholder}
          onChange={e => onChange({ [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
          style={{
            background: '#070c12', border: '1px solid #1a2b3c', borderRadius: 3,
            color: '#cdd9e5', fontFamily: 'IBM Plex Mono', fontSize: 10, padding: '6px 8px',
            outline: 'none',
          }}
        />
      </div>
    )
  }

  return (
    <div style={{
      background: '#0a1018', border: '1px solid #1e3448', borderRadius: 6,
      padding: 20, marginBottom: 20,
    }}>
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#39c5cf', letterSpacing: '0.14em', marginBottom: 16 }}>
        {isEdit ? 'EDIT FIXTURE' : 'ADD NEW FIXTURE'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {field('name', 'NAME', 'text', 'e.g. COB 12W 3000K')}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 8, color: '#2d4f68', letterSpacing: '0.1em' }}>CATEGORY</label>
          <select
            value={data.category}
            onChange={e => onChange({ category: e.target.value })}
            style={{
              background: '#070c12', border: '1px solid #1a2b3c', borderRadius: 3,
              color: '#cdd9e5', fontFamily: 'IBM Plex Mono', fontSize: 10, padding: '6px 8px',
              outline: 'none', cursor: 'pointer',
            }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
            ))}
          </select>
        </div>

        {field('watt',      'WATT',       'number', 'e.g. 12')}
        {field('lumens',    'LUMENS',     'number', 'e.g. 900')}
        {field('beamAngle', 'BEAM ANGLE', 'number', 'e.g. 36')}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 8, color: '#2d4f68', letterSpacing: '0.1em' }}>CCT</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={data.cct}
              onChange={e => onChange({ cct: e.target.value, tunable: e.target.value === 'Tunable' })}
              style={{
                flex: 1, background: '#070c12', border: '1px solid #1a2b3c', borderRadius: 3,
                color: '#cdd9e5', fontFamily: 'IBM Plex Mono', fontSize: 10, padding: '6px 8px',
                outline: 'none', cursor: 'pointer',
              }}
            >
              {(catMeta?.cctOptions ?? ['2700K', '3000K', '4000K', '6500K', 'Tunable']).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#2d4f68', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!data.tunable}
                onChange={e => onChange({ tunable: e.target.checked })}
                style={{ accentColor: '#e8a830' }}
              />
              Tunable
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 8, color: '#2d4f68', letterSpacing: '0.1em' }}>PROTOCOL</label>
          <select
            value={data.protocol ?? 'Room Default'}
            onChange={e => onChange({ protocol: e.target.value })}
            style={{
              background: '#070c12', border: '1px solid #1a2b3c', borderRadius: 3,
              color: '#cdd9e5', fontFamily: 'IBM Plex Mono', fontSize: 10, padding: '6px 8px',
              outline: 'none', cursor: 'pointer',
            }}
          >
            {PROTOCOL_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {field('brand',       'BRAND / MANUFACTURER', 'text', 'e.g. Philips')}
        {field('modelNumber', 'MODEL NUMBER',          'text', 'e.g. DN130B')}

        {isStrip && (
          <>
            {field('voltage', 'VOLTAGE (V)', 'number', 'e.g. 24')}
          </>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 8, color: '#2d4f68', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>NOTES</label>
        <textarea
          value={data.notes ?? ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={2}
          style={{
            width: '100%', background: '#070c12', border: '1px solid #1a2b3c', borderRadius: 3,
            color: '#cdd9e5', fontFamily: 'IBM Plex Mono', fontSize: 10, padding: '6px 8px',
            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: '7px 20px', background: '#0e2a3a', border: '1px solid #39c5cf',
            borderRadius: 3, color: '#39c5cf', fontFamily: 'IBM Plex Mono', fontSize: 10,
            letterSpacing: '0.12em', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >{saving ? 'SAVING...' : 'SAVE'}</button>
        <button
          onClick={onCancel}
          style={{
            padding: '7px 14px', background: 'transparent', border: '1px solid #1a2b3c',
            borderRadius: 3, color: '#4a7a96', fontFamily: 'IBM Plex Mono', fontSize: 10, cursor: 'pointer',
          }}
        >Cancel</button>
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function FixtureLibraryModal({ userId, onSelect, onClose }) {
  const [tab,            setTab]            = useState('standard')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [cardConfigs,    setCardConfigs]    = useState(() => {
    const configs = {}
    CATEGORIES.forEach(cat => { configs[cat] = defaultCardConfig(cat) })
    return configs
  })

  const [myFixtures,   setMyFixtures]   = useState([])
  const [loadingMy,    setLoadingMy]    = useState(false)
  const [showForm,     setShowForm]     = useState(false)
  const [formData,     setFormData]     = useState(EMPTY_FORM)
  const [editId,       setEditId]       = useState(null)
  const [savingForm,   setSavingForm]   = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (tab === 'my' && userId) loadMyFixtures()
  }, [tab, userId])

  async function loadMyFixtures() {
    setLoadingMy(true)
    try   { setMyFixtures(await getUserFixtures(userId)) }
    catch { setMyFixtures([]) }
    finally { setLoadingMy(false) }
  }

  function updateCardConfig(category, updates) {
    setCardConfigs(prev => ({ ...prev, [category]: { ...prev[category], ...updates } }))
  }

  function handleStandardSelect(category) {
    const cfg  = cardConfigs[category]
    if (!cfg) return
    const meta    = CATEGORY_META[category]
    const isStrip = category === 'LED_STRIP'
    let watt, lumens

    if (isStrip) {
      watt   = (cfg.wattPerMtr   ?? 0) * (cfg.length ?? 1)
      lumens = (cfg.lumensPerMtr ?? 0) * (cfg.length ?? 1)
    } else {
      const variant = meta.variants.find(v => v.watt === cfg.watt) ?? meta.variants[0]
      watt   = variant.watt
      lumens = variant.lumens
    }

    const fixture = resolveFixture({
      id:        `lib-${Date.now()}`,
      category,
      name:      isStrip ? `LED Strip ${cfg.length ?? 1}m` : `${meta.label} ${watt}W`,
      watt,
      lumens,
      beamAngle: cfg.beamAngle,
      cct:       cfg.cct,
      tunable:   cfg.cct === 'Tunable',
      voltage:   isStrip ? cfg.voltage : 230,
      protocol:  cfg.protocol ?? 'Room Default',
      ...(isStrip ? { wattPerMtr: cfg.wattPerMtr, lumensPerMtr: cfg.lumensPerMtr, length: cfg.length } : {}),
    })
    onSelect(fixture)
  }

  function handleMySelect(fixture) {
    onSelect(resolveFixture({ ...fixture, id: `my-${fixture.id}-${Date.now()}` }))
  }

  function openEdit(fixture) {
    setFormData({ ...EMPTY_FORM, ...fixture })
    setEditId(fixture.id)
    setShowForm(true)
  }

  function openAdd() {
    setFormData(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  async function handleFormSave() {
    setSavingForm(true)
    try {
      const data = {
        ...formData,
        watt:      Number(formData.watt)      || 0,
        lumens:    Number(formData.lumens)    || 0,
        beamAngle: Number(formData.beamAngle) || 0,
        voltage:   Number(formData.voltage)   || 230,
      }
      if (editId) {
        await updateUserFixture(userId, editId, data)
      } else {
        await saveUserFixture(userId, data)
      }
      await loadMyFixtures()
      setShowForm(false)
      setEditId(null)
      setFormData(EMPTY_FORM)
    } catch (e) {
      console.error('Save fixture failed:', e)
    } finally {
      setSavingForm(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteUserFixture(userId, id)
      await loadMyFixtures()
    } catch (e) {
      console.error('Delete fixture failed:', e)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const visibleCategories = filterCategory === 'ALL' ? CATEGORIES : [filterCategory]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '92vw', height: '88vh',
        background: '#0d1117', border: '1px solid #1a2b3c', borderRadius: 6,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: 'IBM Plex Mono',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderBottom: '1px solid #1a2b3c',
          background: '#0a1018', flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, letterSpacing: '0.2em', color: '#39c5cf' }}>FIXTURE LIBRARY</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: '#4a7a96',
              fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
            }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1a2b3c', flexShrink: 0, background: '#090c10' }}>
          {[['standard', 'STANDARD LIBRARY'], ['my', 'MY FIXTURES']].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 22px', background: 'transparent', border: 'none',
                borderBottom: `2px solid ${tab === t ? '#39c5cf' : 'transparent'}`,
                color: tab === t ? '#39c5cf' : '#4a7a96',
                fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.14em',
                cursor: 'pointer', textTransform: 'uppercase',
              }}
            >{label}</button>
          ))}
        </div>

        {/* ── STANDARD LIBRARY tab ─────────────────────────────────────── */}
        {tab === 'standard' && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

            {/* Sidebar */}
            <div style={{
              width: 190, borderRight: '1px solid #1a2b3c',
              overflowY: 'auto', padding: '10px 0', flexShrink: 0,
              background: '#090c10',
            }}>
              {['ALL', ...CATEGORIES].map(cat => {
                const label = cat === 'ALL' ? 'ALL' : CATEGORY_META[cat].label.toUpperCase()
                const vis   = cat !== 'ALL' ? CATEGORY_VISUAL[cat] : null
                const isActive = filterCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '9px 16px', textAlign: 'left',
                      background: isActive ? '#0e2a3a' : 'transparent', border: 'none',
                      borderLeft: `2px solid ${isActive ? '#39c5cf' : 'transparent'}`,
                      color: isActive ? '#cdd9e5' : '#4a7a96',
                      fontFamily: 'IBM Plex Mono', fontSize: 9, letterSpacing: '0.12em',
                      cursor: 'pointer', textTransform: 'uppercase',
                    }}
                  >
                    {vis && (
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: vis.fill, border: `1.5px solid ${vis.stroke}`,
                      }} />
                    )}
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Cards grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: 16,
              }}>
                {visibleCategories.map(cat => (
                  <CategoryCard
                    key={cat}
                    category={cat}
                    config={cardConfigs[cat]}
                    onConfigChange={updates => updateCardConfig(cat, updates)}
                    onSelect={() => handleStandardSelect(cat)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MY FIXTURES tab ──────────────────────────────────────────── */}
        {tab === 'my' && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#4a7a96', letterSpacing: '0.12em' }}>
                MY CUSTOM FIXTURES
              </span>
              <button
                onClick={openAdd}
                style={{
                  padding: '7px 16px', background: '#0e2a3a', border: '1px solid #39c5cf',
                  borderRadius: 3, color: '#39c5cf', fontFamily: 'IBM Plex Mono',
                  fontSize: 9, letterSpacing: '0.12em', cursor: 'pointer',
                }}
              >+ ADD NEW FIXTURE</button>
            </div>

            {/* Inline form */}
            {showForm && (
              <FixtureForm
                data={formData}
                onChange={updates => setFormData(prev => ({ ...prev, ...updates }))}
                onSave={handleFormSave}
                onCancel={() => { setShowForm(false); setEditId(null); setFormData(EMPTY_FORM) }}
                saving={savingForm}
                isEdit={!!editId}
              />
            )}

            {/* Fixture list */}
            {loadingMy ? (
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#2d4f68', padding: 20 }}>Loading...</div>
            ) : myFixtures.length === 0 ? (
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#2d4f68', padding: '40px 0', textAlign: 'center' }}>
                No custom fixtures yet. Add your first fixture above.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: 16,
              }}>
                {myFixtures.map(f => (
                  <MyFixtureCard
                    key={f.id}
                    fixture={f}
                    onSelect={() => handleMySelect(f)}
                    onEdit={() => openEdit(f)}
                    onDelete={() => setDeleteConfirm(f.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation overlay */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#0d1117', border: '1px solid #1a2b3c', borderRadius: 6,
            padding: '24px 28px', fontFamily: 'IBM Plex Mono', textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: 11, color: '#cdd9e5', marginBottom: 8 }}>Delete this fixture?</div>
            <div style={{ fontSize: 9, color: '#2d4f68', marginBottom: 20 }}>This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  padding: '7px 18px', background: '#2a0e0e', border: '1px solid #d94f4f',
                  borderRadius: 3, color: '#d94f4f', fontFamily: 'IBM Plex Mono',
                  fontSize: 10, cursor: 'pointer',
                }}
              >Delete</button>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '7px 18px', background: 'transparent', border: '1px solid #1a2b3c',
                  borderRadius: 3, color: '#4a7a96', fontFamily: 'IBM Plex Mono',
                  fontSize: 10, cursor: 'pointer',
                }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
