import { useState, useEffect } from 'react'
import { CATEGORY_META, CATEGORY_VISUAL, resolveFixture } from '../data/fixtureLibrary'
import { getUserFixtures, saveUserFixture, updateUserFixture, deleteUserFixture } from '../firebase'

const CATEGORIES = [
  'COB_DOWNLIGHT', 'SPOTLIGHT', 'PANEL', 'LINEAR', 'WALL_WASHER', 'LED_STRIP',
  'CHANDELIER', 'PENDANT', 'TRACK_LIGHT', 'COVE_LIGHT', 'BOLLARD', 'FLOOD_LIGHT', 'SURFACE_PANEL',
]

const CAT_SHORT = {
  COB_DOWNLIGHT: 'Downlight',
  SPOTLIGHT:     'Spotlight',
  PANEL:         'Panel',
  LINEAR:        'Linear',
  WALL_WASHER:   'Wall Washer',
  LED_STRIP:     'LED Strip',
  CHANDELIER:    'Chandelier',
  PENDANT:       'Pendant',
  TRACK_LIGHT:   'Track Light',
  COVE_LIGHT:    'Cove Light',
  BOLLARD:       'Bollard',
  FLOOD_LIGHT:   'Flood Light',
  SURFACE_PANEL: 'Surface Panel',
}

const PROTOCOL_OPTIONS = [
  { value: 'Room Default', label: 'Room Default' },
  { value: 'NON-DIM',      label: 'Non-dim' },
  { value: 'PHASE-CUT',    label: 'Phase-cut' },
  { value: '0-10V',        label: '0-10V' },
  { value: 'DALI',         label: 'DALI' },
  { value: 'ZIGBEE',       label: 'Zigbee' },
]

const EMPTY_FORM = {
  name: '', category: 'COB_DOWNLIGHT', watt: '', lumens: '', beamAngle: '',
  cct: '3000K', tunable: false, brand: '', modelNumber: '', notes: '', voltage: 230,
  protocol: 'Room Default',
}

// ── Input helpers ─────────────────────────────────────────────────────────────
const inputSt = {
  width: '100%', background: '#222', border: '1px solid #2e2e2e', borderRadius: 4,
  color: '#f0f0f0', fontFamily: 'IBM Plex Mono', fontSize: 12, padding: '5px 8px',
  outline: 'none', boxSizing: 'border-box',
}
const labelSt = { fontSize: 10, color: '#555', letterSpacing: '0.05em', display: 'block', marginBottom: 3 }

function PanelSelect({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {label && <label style={labelSt}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  )
}

function PanelInput({ label, value, onChange, placeholder, type = 'number' }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {label && <label style={labelSt}>{label}</label>}
      <input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={inputSt}
      />
    </div>
  )
}

// ── Accordion standard tab ────────────────────────────────────────────────────
function StandardTab({ onSelect, isProfessional, onProfessionalGate }) {
  const [openCat,    setOpenCat]    = useState('COB_DOWNLIGHT')
  const [picked,     setPicked]     = useState(null)   // { cat, watt }
  const [pickedWatt, setPickedWatt] = useState(null)
  const [pickedBeam, setPickedBeam] = useState(null)
  const [stripCfg,   setStripCfg]  = useState({ wattPerMtr: 10, lumensPerMtr: 800, length: 1, voltage: 24 })

  function handleCatClick(cat) {
    if (CATEGORY_META[cat]?.professionalOnly && !isProfessional) {
      onProfessionalGate?.()
      return
    }
    if (openCat === cat) {
      setOpenCat(null)
      setPicked(null)
      setPickedBeam(null)
    } else {
      setOpenCat(cat)
      setPicked(null)
      setPickedBeam(null)
    }
  }

  function handleVariantClick(cat, variant) {
    setPicked({ cat, watt: variant.watt })
    setPickedWatt(variant.watt)
    // Initialise beam to the variant's own beam angle, fall back to category default
    setPickedBeam(variant.beamAngle ?? CATEGORY_META[cat].beamAngles[0])
  }

  function handleSelect(cat) {
    if (CATEGORY_META[cat]?.professionalOnly && !isProfessional) {
      onProfessionalGate?.()
      return
    }
    const meta     = CATEGORY_META[cat]
    const watt     = pickedWatt
    const variant  = meta.variants.find(v => v.watt === watt) ?? meta.variants[0]
    const beamAngle = pickedBeam ?? variant.beamAngle ?? meta.beamAngles[0]
    onSelect(resolveFixture({
      id:        `lib-${Date.now()}`,
      category:  cat,
      name:      variant.label ? `${meta.label} ${variant.label}` : `${meta.label} ${variant.watt}W`,
      watt:      variant.watt,
      lumens:    variant.lumens,
      beamAngle,
      cct:       meta.cctOptions[0],
      tunable:   false,
      voltage:   230,
      protocol:  'Room Default',
    }))
  }

  function handleStripSelect() {
    const cfg = stripCfg
    onSelect(resolveFixture({
      id:           `lib-${Date.now()}`,
      category:     'LED_STRIP',
      name:         `LED Strip ${cfg.length}m`,
      watt:         (cfg.wattPerMtr   ?? 0) * (cfg.length ?? 1),
      lumens:       (cfg.lumensPerMtr ?? 0) * (cfg.length ?? 1),
      beamAngle:    120,
      cct:          '3000K',
      tunable:      false,
      voltage:      cfg.voltage,
      wattPerMtr:   cfg.wattPerMtr,
      lumensPerMtr: cfg.lumensPerMtr,
      length:       cfg.length,
      protocol:     'Room Default',
    }))
  }

  const selectBtn = (onClick) => (
    <button
      onClick={onClick}
      style={{
        width: '100%', height: 28, background: '#d4a843', border: 'none', borderRadius: 3,
        color: '#0f0f0f', fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', letterSpacing: '0.04em',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#e0b84e' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#d4a843' }}
    >SELECT</button>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {CATEGORIES.map((cat, idx) => {
        const meta     = CATEGORY_META[cat]
        const vis      = CATEGORY_VISUAL[cat]
        const isOpen   = openCat === cat
        const isStrip  = cat === 'LED_STRIP'
        const isPro    = !!meta?.professionalOnly
        const locked   = isPro && !isProfessional
        const prevMeta = idx > 0 ? CATEGORY_META[CATEGORIES[idx - 1]] : null
        const showDivider = isPro && !prevMeta?.professionalOnly

        return (
          <div key={cat}>
            {/* PROFESSIONAL section divider */}
            {showDivider && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 6px' }}>
                <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
                <span style={{ fontSize: 8, color: '#d4a843', letterSpacing: '0.14em', fontWeight: 600 }}>PROFESSIONAL</span>
                <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
              </div>
            )}

            {/* Category header row */}
            <button
              onClick={() => handleCatClick(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                width: '100%', height: 36, padding: '0 14px',
                background: isOpen ? '#191919' : 'transparent',
                border: 'none', borderBottom: '1px solid #2e2e2e',
                borderLeft: `2px solid ${isOpen ? (isPro ? '#9b59b6' : '#d4a843') : 'transparent'}`,
                color: isOpen ? '#f0f0f0' : (locked ? '#666' : '#888'),
                fontFamily: 'IBM Plex Mono', fontSize: 12,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s, color 0.1s',
              }}
              onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.color = '#ccc' } }}
              onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.color = locked ? '#666' : '#888' } }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: vis?.fill ?? '#888', border: `1.5px solid ${vis?.stroke ?? '#888'}`, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{CAT_SHORT[cat]}</span>
              {locked
                ? <span style={{ fontSize: 8, color: '#d4a843', letterSpacing: '0.08em' }}>PRO+</span>
                : <span style={{ fontSize: 9, color: '#444' }}>{isOpen ? '▲' : '▼'}</span>
              }
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div style={{ maxHeight: 200, overflowY: 'auto', borderBottom: '1px solid #2e2e2e', background: '#0f0f0f' }}>
                {isStrip ? (
                  /* LED Strip — custom inputs */
                  <div style={{ padding: '10px 14px', borderLeft: '2px solid #d4a843', background: '#0f0d05' }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelSt}>W/m</label>
                        <input type="number" value={stripCfg.wattPerMtr}
                          onChange={e => setStripCfg(p => ({ ...p, wattPerMtr: Number(e.target.value) }))}
                          style={{ ...inputSt, padding: '4px 6px', fontSize: 11 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelSt}>lm/m</label>
                        <input type="number" value={stripCfg.lumensPerMtr}
                          onChange={e => setStripCfg(p => ({ ...p, lumensPerMtr: Number(e.target.value) }))}
                          style={{ ...inputSt, padding: '4px 6px', fontSize: 11 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelSt}>Length m</label>
                        <input type="number" value={stripCfg.length}
                          onChange={e => setStripCfg(p => ({ ...p, length: Number(e.target.value) }))}
                          style={{ ...inputSt, padding: '4px 6px', fontSize: 11 }} />
                      </div>
                    </div>
                    {selectBtn(handleStripSelect)}
                  </div>
                ) : (
                  /* Standard variants list */
                  meta.variants.map(v => {
                    const isPickedRow = picked?.cat === cat && picked?.watt === v.watt
                    return (
                      <div key={v.watt}>
                        <div
                          onClick={() => handleVariantClick(cat, v)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '7px 14px 7px 16px', cursor: 'pointer',
                            borderLeft: `2px solid ${isPickedRow ? '#d4a843' : 'transparent'}`,
                            background: isPickedRow ? '#1a1500' : 'transparent',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => { if (!isPickedRow) e.currentTarget.style.background = '#1a1a1a' }}
                          onMouseLeave={e => { if (!isPickedRow) e.currentTarget.style.background = 'transparent' }}
                        >
                          <span style={{ fontSize: 12, color: isPickedRow ? '#f0f0f0' : '#999' }}>
                            {meta.label} {v.watt}W
                          </span>
                          <span style={{ fontSize: 11, color: '#555' }}>
                            {v.lumens}lm · {v.beamAngle ?? meta.beamAngles[0]}°
                          </span>
                        </div>

                        {/* Wattage + beam angle dropdowns + SELECT only for the picked row */}
                        {isPickedRow && (
                          <div style={{ padding: '6px 14px 10px', background: '#120f00' }}>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <label style={labelSt}>WATTAGE</label>
                                <select
                                  value={pickedWatt ?? ''}
                                  onChange={e => {
                                    const w = Number(e.target.value)
                                    setPickedWatt(w)
                                    // sync beam to the selected variant's default
                                    const vv = meta.variants.find(x => x.watt === w)
                                    setPickedBeam(vv?.beamAngle ?? meta.beamAngles[0])
                                  }}
                                  style={{ ...inputSt, cursor: 'pointer', fontSize: 11 }}
                                >
                                  {meta.variants.map(vv => (
                                    <option key={vv.watt} value={vv.watt}>{vv.watt}W — {vv.lumens}lm</option>
                                  ))}
                                </select>
                              </div>
                              {meta.beamAngles.length > 1 && (
                                <div style={{ flex: 1 }}>
                                  <label style={labelSt}>BEAM °</label>
                                  <select
                                    value={pickedBeam ?? meta.beamAngles[0]}
                                    onChange={e => setPickedBeam(Number(e.target.value))}
                                    style={{ ...inputSt, cursor: 'pointer', fontSize: 11 }}
                                  >
                                    {meta.beamAngles.map(b => (
                                      <option key={b} value={b}>{b}°</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                            {selectBtn(() => handleSelect(cat))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── My Fixtures row ───────────────────────────────────────────────────────────
function FixtureRow({ fixture, isActive, onSelect, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const vis = CATEGORY_VISUAL[fixture.category] ?? CATEGORY_VISUAL.COB_DOWNLIGHT
  const aBtn = {
    height: 22, padding: '0 8px', background: 'transparent',
    border: '1px solid #2e2e2e', borderRadius: 3,
    color: '#888', fontFamily: 'IBM Plex Mono', fontSize: 10, cursor: 'pointer',
    transition: 'color 0.1s, border-color 0.1s',
  }
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 14px',
        borderLeft: `2px solid ${isActive ? '#d4a843' : 'transparent'}`,
        background: isActive ? '#1a1500' : hovered ? '#1a1a1a' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: vis.fill, border: `1.5px solid ${vis.stroke}`, flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#f0f0f0', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fixture.name || 'Unnamed'}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
            {fixture.watt}W · {fixture.lumens}lm · {fixture.beamAngle}°
            {fixture.cct ? ` · ${fixture.cct}` : ''}
          </div>
        </div>
      </div>
      {hovered && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6, paddingLeft: 15 }}>
          <button
            style={{ ...aBtn, color: '#d4a843', borderColor: '#d4a84344' }}
            onClick={e => { e.stopPropagation(); onSelect() }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4a843' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d4a84344' }}
          >Select</button>
          <button
            style={aBtn}
            onClick={e => { e.stopPropagation(); onEdit() }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f0f0f0'; e.currentTarget.style.borderColor = '#555' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#2e2e2e' }}
          >Edit</button>
          <button
            style={aBtn}
            onClick={e => { e.stopPropagation(); onDelete() }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e05252'; e.currentTarget.style.borderColor = '#e05252' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#2e2e2e' }}
          >Delete</button>
        </div>
      )}
    </div>
  )
}

// ── Add / Edit form ───────────────────────────────────────────────────────────
function FixtureForm({ data, onChange, onSave, onCancel, saving, isEdit }) {
  const isStrip = data.category === 'LED_STRIP'
  const catMeta = CATEGORY_META[data.category]
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid #2e2e2e', background: '#111' }}>
      <div style={{ fontSize: 11, color: '#d4a843', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
        {isEdit ? 'Edit Fixture' : 'Add New Fixture'}
      </div>

      <PanelInput type="text"   label="Name"        value={data.name}       onChange={v => onChange({ name: v })}              placeholder="e.g. COB 12W 3000K" />
      <PanelInput type="number" label="Watts"        value={data.watt}       onChange={v => onChange({ watt: Number(v) })}       placeholder="e.g. 12" />
      <PanelInput type="number" label="Lumens"       value={data.lumens}     onChange={v => onChange({ lumens: Number(v) })}     placeholder="e.g. 900" />
      <PanelInput type="number" label="Beam angle °" value={data.beamAngle}  onChange={v => onChange({ beamAngle: Number(v) })}  placeholder="e.g. 36" />

      <PanelSelect
        label="Category"
        value={data.category}
        onChange={v => onChange({ category: v })}
        options={CATEGORIES.map(cat => ({ value: cat, label: CATEGORY_META[cat].label }))}
      />
      <PanelSelect
        label="CCT"
        value={data.cct}
        onChange={v => onChange({ cct: v, tunable: v === 'Tunable' })}
        options={(catMeta?.cctOptions ?? ['2700K', '3000K', '4000K', '6500K', 'Tunable']).map(c => ({ value: c, label: c }))}
      />
      <PanelSelect
        label="Protocol"
        value={data.protocol ?? 'Room Default'}
        onChange={v => onChange({ protocol: v })}
        options={PROTOCOL_OPTIONS}
      />

      <PanelInput type="text" label="Brand (optional)"        value={data.brand}       onChange={v => onChange({ brand: v })}        placeholder="e.g. Philips" />
      <PanelInput type="text" label="Model number (optional)" value={data.modelNumber} onChange={v => onChange({ modelNumber: v })} placeholder="e.g. DN130B" />

      <div style={{ marginBottom: 12 }}>
        <label style={labelSt}>Notes</label>
        <textarea
          value={data.notes ?? ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={2}
          style={{ ...inputSt, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            flex: 1, height: 30, background: '#d4a843', border: 'none', borderRadius: 4,
            color: '#0f0f0f', fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 600,
            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >{saving ? 'Saving…' : 'Save'}</button>
        <button
          onClick={onCancel}
          style={{
            height: 30, padding: '0 14px', background: 'transparent',
            border: '1px solid #2e2e2e', borderRadius: 4,
            color: '#888', fontFamily: 'IBM Plex Mono', fontSize: 11, cursor: 'pointer',
          }}
        >Cancel</button>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function FixturePanel({ activeFixtureId, onSelect, userId, isProfessional, onProfessionalGate }) {
  const [tab,           setTab]           = useState('standard')
  const [myFixtures,    setMyFixtures]    = useState([])
  const [loadingMy,     setLoadingMy]     = useState(false)
  const [showForm,      setShowForm]      = useState(false)
  const [formData,      setFormData]      = useState(EMPTY_FORM)
  const [editId,        setEditId]        = useState(null)
  const [savingForm,    setSavingForm]    = useState(false)
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

  const tabBtn = (t, label) => (
    <button
      key={t}
      onClick={() => setTab(t)}
      style={{
        flex: 1, height: 36, background: 'transparent', border: 'none',
        borderBottom: `2px solid ${tab === t ? '#d4a843' : 'transparent'}`,
        color: tab === t ? '#f0f0f0' : '#555',
        fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 400,
        letterSpacing: '0.06em', cursor: 'pointer', transition: 'color 0.1s',
      }}
      onMouseEnter={e => { if (tab !== t) e.currentTarget.style.color = '#888' }}
      onMouseLeave={e => { if (tab !== t) e.currentTarget.style.color = '#555' }}
    >{label}</button>
  )

  return (
    <aside style={{
      width: 260, minWidth: 260, height: '100%',
      background: '#141414', borderRight: '1px solid #2e2e2e',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
      fontFamily: 'IBM Plex Mono',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2e2e2e', flexShrink: 0 }}>
        {tabBtn('standard', 'STANDARD')}
        {tabBtn('my', 'MY FIXTURES')}
      </div>

      {/* ── STANDARD tab ──────────────────────────────────────────────────── */}
      {tab === 'standard' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <StandardTab onSelect={onSelect} isProfessional={isProfessional} onProfessionalGate={onProfessionalGate} />
        </div>
      )}

      {/* ── MY FIXTURES tab ───────────────────────────────────────────────── */}
      {tab === 'my' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #2e2e2e', flexShrink: 0 }}>
            <button
              onClick={openAdd}
              style={{
                width: '100%', height: 30,
                background: 'transparent', border: '1px solid #2e2e2e', borderRadius: 4,
                color: '#888', fontFamily: 'IBM Plex Mono', fontSize: 11,
                cursor: 'pointer', transition: 'border-color 0.1s, color 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4a843'; e.currentTarget.style.color = '#d4a843' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2e2e'; e.currentTarget.style.color = '#888' }}
            >+ Add New Fixture</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
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

            {loadingMy ? (
              <div style={{ padding: 20, fontSize: 11, color: '#555', textAlign: 'center' }}>Loading…</div>
            ) : !userId ? (
              <div style={{ padding: 20, fontSize: 11, color: '#555', textAlign: 'center' }}>Sign in to save custom fixtures</div>
            ) : myFixtures.length === 0 && !showForm ? (
              <div style={{ padding: '32px 20px', fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
                No custom fixtures yet.<br />Click "+ Add New Fixture" above.
              </div>
            ) : (
              myFixtures.map(f => (
                <FixtureRow
                  key={f.id}
                  fixture={f}
                  isActive={activeFixtureId?.startsWith(`my-${f.id}`)}
                  onSelect={() => handleMySelect(f)}
                  onEdit={() => openEdit(f)}
                  onDelete={() => setDeleteConfirm(f.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 6,
            padding: '20px 24px', fontFamily: 'IBM Plex Mono', textAlign: 'center',
            width: 200,
          }}>
            <div style={{ fontSize: 12, color: '#f0f0f0', marginBottom: 6 }}>Delete fixture?</div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 16 }}>Cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1, height: 28, background: 'transparent',
                  border: '1px solid #e05252', borderRadius: 4,
                  color: '#e05252', fontFamily: 'IBM Plex Mono', fontSize: 11, cursor: 'pointer',
                }}
              >Delete</button>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, height: 28, background: 'transparent',
                  border: '1px solid #2e2e2e', borderRadius: 4,
                  color: '#888', fontFamily: 'IBM Plex Mono', fontSize: 11, cursor: 'pointer',
                }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
