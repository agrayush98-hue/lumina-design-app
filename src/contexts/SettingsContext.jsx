import { createContext, useContext, useState } from 'react'

export const DEFAULT_SETTINGS = {
  display: {
    showGrid:           true,
    showRuler:          true,
    showDimensionLines: true,
    showFixtureLabels:  true,
    gridOpacity:        60,   // %
    gridSize:           500,
  },
  room: {
    width:  6000,     // mm
    length: 4000,     // mm
    type:   'Office',
  },
  calculations: {
    ceilingHeight:    2700,  // mm
    minLux:           150,
    targetLux:        300,   // lx
    maxLux:           500,
    maintenanceFactor: 0.80,
    uniformityTarget:  0.40,
  },
  materials: {
    ceilingReflectance: 70,  // %
    wallReflectance:    50,
    floorReflectance:   20,
  },
  units: {
    length:      'mm',
    illuminance: 'lux',
  },
  project: {
    name:     'Untitled Project',
    number:   '',
    location: '',
    designer: '',
    client:   '',
  },
  export: {
    format:                 'PDF',
    paperSize:              'A4',
    quality:                'Medium',
    includeTitleBlock:      true,
    includeFixtureSchedule: true,
    includeLuxReport:       true,
    includeHeatMap:         true,
    includeBeamDiagram:     false,
  },
  performance: {
    heatMapCellSize:   8,    // px per cell
    autoUpdateHeatMap: true,
  },
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('lumina_settings')
    if (!saved) return DEFAULT_SETTINGS
    try {
      const p = JSON.parse(saved)
      return {
        display:      { ...DEFAULT_SETTINGS.display,      ...p.display },
        room:         { ...DEFAULT_SETTINGS.room,         ...p.room },
        calculations: { ...DEFAULT_SETTINGS.calculations, ...p.calculations },
        materials:    { ...DEFAULT_SETTINGS.materials,    ...p.materials },
        units:        { ...DEFAULT_SETTINGS.units,        ...p.units },
        project:      { ...DEFAULT_SETTINGS.project,      ...p.project },
        export:       { ...DEFAULT_SETTINGS.export,       ...p.export },
        performance:  { ...DEFAULT_SETTINGS.performance,  ...p.performance },
      }
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const updateSetting = (section, key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [section]: { ...prev[section], [key]: value } }
      localStorage.setItem('lumina_settings', JSON.stringify(next))
      return next
    })
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.setItem('lumina_settings', JSON.stringify(DEFAULT_SETTINGS))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
