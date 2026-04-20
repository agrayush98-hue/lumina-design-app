export const UNIT_KEY = 'lumina_dimension_unit'

export const UNIT_OPTIONS = [
  { value: 'mm', label: 'mm' },
  { value: 'm',  label: 'm'  },
  { value: 'ft', label: 'ft' },
  { value: 'in', label: 'in' },
]

export function toMM(value, unit) {
  const n = Number(value)
  if (isNaN(n)) return NaN
  if (unit === 'mm') return n
  if (unit === 'm')  return n * 1000
  if (unit === 'ft') return n * 304.8
  if (unit === 'in') return n * 25.4
  return n
}

export function fromMM(mm, unit) {
  const n = Number(mm)
  if (!n || isNaN(n)) return ''
  if (unit === 'mm') return n
  if (unit === 'm')  return +(n / 1000).toFixed(3)
  if (unit === 'ft') return +(n / 304.8).toFixed(2)
  if (unit === 'in') return +(n / 25.4).toFixed(2)
  return n
}

export function getStoredUnit() {
  try { return localStorage.getItem(UNIT_KEY) ?? 'mm' } catch { return 'mm' }
}
