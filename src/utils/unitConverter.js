export const LENGTH_UNITS = {
  mm: { label: 'mm', perMm: 1,         decimals: 0 },
  cm: { label: 'cm', perMm: 0.1,       decimals: 1 },
  m:  { label: 'm',  perMm: 0.001,     decimals: 3 },
  ft: { label: 'ft', perMm: 1 / 304.8, decimals: 2 },
}

export function mmToUnit(mm, unit) {
  const u = LENGTH_UNITS[unit] || LENGTH_UNITS.mm
  return parseFloat((mm * u.perMm).toFixed(u.decimals))
}

export function unitToMm(val, unit) {
  const u = LENGTH_UNITS[unit] || LENGTH_UNITS.mm
  return Math.round(val / u.perMm)
}

export function unitLabel(unit) {
  return (LENGTH_UNITS[unit] || LENGTH_UNITS.mm).label
}

export const ILLUM_UNITS = {
  lux: { label: 'lx', factor: 1 },
  fc:  { label: 'fc', factor: 1 / 10.764 },
}

export function luxToUnit(lux, unit) {
  return unit === 'fc'
    ? (lux / 10.764).toFixed(1)
    : Math.round(lux).toString()
}

export function illumLabel(unit) {
  return (ILLUM_UNITS[unit] || ILLUM_UNITS.lux).label
}
