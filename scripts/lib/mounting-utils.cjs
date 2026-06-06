'use strict'

/**
 * Derive mounting type from fixture category and optional name/description string.
 * Used by both convert-ies-to-library.cjs and convert-scraped-to-library.cjs.
 */
function mountingFromCategory(cat, desc) {
  const d = (desc || '').toLowerCase()
  if (cat === 'Pendant')     return 'Suspended'
  if (cat === 'Track_Light') return 'Track'
  if (cat === 'High_Bay')    return 'Suspension'
  if (cat === 'Wall_Washer') return 'Surface'
  if (cat === 'Linear')      return 'Surface'
  if (cat === 'Panel')       return 'Recessed'
  if (cat === 'Floodlight')  return 'Surface'
  if (d.includes('surface')) return 'Surface'
  if (d.includes('suspend') || d.includes('pendant')) return 'Suspended'
  return 'Recessed'
}

module.exports = { mountingFromCategory }
