/**
 * Configurable Fixture Library (Complete)
 *
 * 20 fixture types across all categories.
 * All specs are category-level industry standards — NO brand names or model numbers.
 *
 * Schema: { id, name, category, mounting, icon, powerOptions, beamOptions,
 *           glareOptions, ipOptions, cctOptions, criOptions, chipOptions,
 *           protocols, calculateLumens, ... }
 */

export const CONFIGURABLE_FIXTURES = [

  // ─── 1. COB DOWNLIGHT — RECESSED ────────────────────────────
  {
    id: 'cob-downlight',
    name: 'COB Downlight',
    category: 'DOWNLIGHT',
    mounting: 'Recessed',
    icon: '⬤',
    powerOptions: [3, 5, 7, 9, 10, 12, 14, 15, 16, 18, 20, 22, 24, 26, 30, 36],
    beamOptions: [
      { angle: 15, label: '15° Narrow Spot' },
      { angle: 24, label: '24° Spot' },
      { angle: 36, label: '36° Medium' },
      { angle: 60, label: '60° Wide' },
      { angle: 90, label: '90° Very Wide' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard', ugrMax: 22, cutoff: null },
      { id: 'antiglare', label: 'Anti-Glare', ugrMax: 19, cutoff: 30 },
      { id: 'deep-baffle', label: 'Deep Baffle', ugrMax: 16, cutoff: 35 },
      { id: 'honeycomb', label: 'Honeycomb Louver', ugrMax: 14, cutoff: 40 },
    ],
    ipOptions: ['IP20', 'IP44', 'IP65'],
    cctOptions: [2700, 3000, 4000, 6500],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
      { value: 95, label: 'CRI 95' },
      { value: 97, label: 'CRI 97+' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 90 },
      { id: 'premium', label: 'Premium', efficacy: 110 },
      { id: 'ultra', label: 'Ultra Premium', efficacy: 130 },
    ],
    protocols: ['ON/OFF', 'PHASE-CUT', '0-10V', 'DALI DT6', 'DALI DT8'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 2. SMD DOWNLIGHT — RECESSED ────────────────────────────
  {
    id: 'smd-downlight',
    name: 'SMD Downlight',
    category: 'DOWNLIGHT',
    mounting: 'Recessed',
    icon: '◎',
    powerOptions: [3, 5, 7, 9, 12, 15, 18, 24],
    beamOptions: [
      { angle: 36, label: '36° Medium' },
      { angle: 60, label: '60° Wide' },
      { angle: 90, label: '90° Very Wide' },
      { angle: 120, label: '120° Ultra Wide' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard', ugrMax: 22, cutoff: null },
      { id: 'antiglare', label: 'Anti-Glare', ugrMax: 19, cutoff: 30 },
    ],
    ipOptions: ['IP20', 'IP44', 'IP65'],
    cctOptions: [2700, 3000, 4000, 6500],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 85 },
      { id: 'premium', label: 'Premium', efficacy: 100 },
    ],
    protocols: ['ON/OFF', 'PHASE-CUT', '0-10V', 'DALI DT6'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 3. RECESSED PINHOLE SPOTLIGHT ──────────────────────────
  {
    id: 'pinhole-spotlight',
    name: 'Pinhole Spotlight',
    category: 'SPOTLIGHT',
    mounting: 'Recessed',
    icon: '·',
    powerOptions: [1, 3, 5, 7, 9, 10, 12],
    beamOptions: [
      { angle: 5, label: '5° Ultra Narrow' },
      { angle: 6, label: '6° Pin Spot' },
      { angle: 8, label: '8° Pin Spot' },
      { angle: 15, label: '15° Narrow' },
      { angle: 24, label: '24° Spot' },
    ],
    glareOptions: [
      { id: 'pinhole', label: 'Pinhole Housing', ugrMax: 19, cutoff: 40 },
      { id: 'cone', label: 'Cone Housing', ugrMax: 19, cutoff: 30 },
    ],
    ipOptions: ['IP20', 'IP44'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 90, label: 'CRI 90' },
      { value: 95, label: 'CRI 95' },
      { value: 97, label: 'CRI 97+' },
    ],
    chipOptions: [
      { id: 'premium', label: 'Premium', efficacy: 110 },
      { id: 'ultra', label: 'Ultra Premium', efficacy: 130 },
    ],
    protocols: ['ON/OFF', '0-10V', 'DALI DT6'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 4. RECESSED TILTABLE EYEBALL SPOTLIGHT ─────────────────
  {
    id: 'tiltable-spotlight',
    name: 'Tiltable Spotlight',
    category: 'SPOTLIGHT',
    mounting: 'Recessed',
    icon: '◉',
    powerOptions: [5, 7, 9, 10, 12, 14, 15, 20],
    beamOptions: [
      { angle: 15, label: '15° Narrow Spot' },
      { angle: 24, label: '24° Spot' },
      { angle: 36, label: '36° Medium' },
      { angle: 50, label: '50° Wide' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard', ugrMax: 22, cutoff: null },
      { id: 'antiglare', label: 'Anti-Glare', ugrMax: 19, cutoff: 35 },
      { id: 'deep-baffle', label: 'Deep Baffle', ugrMax: 16, cutoff: 41 },
    ],
    ipOptions: ['IP20', 'IP44'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 90, label: 'CRI 90' },
      { value: 95, label: 'CRI 95' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 95 },
      { id: 'premium', label: 'Premium', efficacy: 115 },
    ],
    protocols: ['ON/OFF', 'PHASE-CUT', '0-10V', 'DALI DT6', 'DALI DT8'],
    tilt: 30,
    rotation: 355,
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 5. RECESSED TRIMLESS SPOTLIGHT ─────────────────────────
  {
    id: 'trimless-spotlight',
    name: 'Trimless Spotlight',
    category: 'SPOTLIGHT',
    mounting: 'Recessed Trimless',
    icon: '○',
    powerOptions: [5, 7, 9, 10, 12, 14, 20],
    beamOptions: [
      { angle: 15, label: '15° Narrow' },
      { angle: 24, label: '24° Spot' },
      { angle: 36, label: '36° Medium' },
      { angle: 50, label: '50° Wide' },
    ],
    glareOptions: [
      { id: 'antiglare', label: 'Anti-Glare', ugrMax: 19, cutoff: 30 },
      { id: 'deep-baffle', label: 'Deep Baffle', ugrMax: 16, cutoff: 36 },
    ],
    ipOptions: ['IP20', 'IP44'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 90, label: 'CRI 90' },
      { value: 95, label: 'CRI 95' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 95 },
      { id: 'premium', label: 'Premium', efficacy: 115 },
    ],
    protocols: ['ON/OFF', '0-10V', 'DALI DT6'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 6. IP65 WET AREA DOWNLIGHT ─────────────────────────────
  {
    id: 'ip65-downlight',
    name: 'IP65 Wet Area Downlight',
    category: 'DOWNLIGHT',
    mounting: 'Recessed',
    icon: '💧',
    powerOptions: [5, 7, 9, 10, 12, 15, 18],
    beamOptions: [
      { angle: 40, label: '40° Medium' },
      { angle: 60, label: '60° Wide' },
      { angle: 90, label: '90° Very Wide' },
    ],
    glareOptions: [
      { id: 'antiglare', label: 'Anti-Glare Reflector', ugrMax: 19, cutoff: 30 },
    ],
    ipOptions: ['IP65'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
      { value: 95, label: 'CRI 95' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 85 },
      { id: 'premium', label: 'Premium', efficacy: 105 },
    ],
    protocols: ['ON/OFF', 'PHASE-CUT', '0-10V', 'DALI DT6'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 7. RECESSED WALL WASHER ─────────────────────────────────
  {
    id: 'recessed-wall-washer',
    name: 'Recessed Wall Washer',
    category: 'WALL WASHER',
    mounting: 'Recessed',
    icon: '▬',
    powerOptions: [8, 10, 12, 15, 18, 20, 22],
    beamOptions: [
      { angle: 'asymmetric', label: 'Asymmetric (Wall Wash)' },
      { angle: 57, label: '57° Wide' },
      { angle: 110, label: '110° Grazing' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard Reflector', ugrMax: 22, cutoff: null },
      { id: 'hidden', label: 'Hidden Source', ugrMax: 99, cutoff: null },
    ],
    ipOptions: ['IP20', 'IP44'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 90, label: 'CRI 90' },
      { value: 95, label: 'CRI 95' },
      { value: 97, label: 'CRI 97+' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 90 },
      { id: 'premium', label: 'Premium', efficacy: 110 },
    ],
    protocols: ['ON/OFF', '0-10V', 'DALI DT6'],
    spacingRule: '1:1:3',
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 8. FLOOR WASHER ─────────────────────────────────────────
  {
    id: 'floor-washer',
    name: 'Floor Washer',
    category: 'WALL WASHER',
    mounting: 'Wall Recessed',
    icon: '↓',
    powerOptions: [3, 5, 7],
    beamOptions: [
      { angle: 'wide-down', label: 'Wide Downward' },
    ],
    glareOptions: [
      { id: 'concealed', label: 'Concealed Source', ugrMax: 99, cutoff: null },
    ],
    ipOptions: ['IP20'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 90, label: 'CRI 90' },
      { value: 95, label: 'CRI 95' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 90 },
    ],
    protocols: ['ON/OFF', 'DALI DT6'],
    installNote: 'Mount 10mm from wall edge. For corridors and stairways only.',
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 9. SURFACE SPOTLIGHT ────────────────────────────────────
  {
    id: 'surface-spotlight',
    name: 'Surface Spotlight',
    category: 'SPOTLIGHT',
    mounting: 'Surface',
    icon: '▲',
    powerOptions: [7, 10, 12, 15, 18, 20, 25, 30, 38],
    beamOptions: [
      { angle: 15, label: '15° Narrow' },
      { angle: 24, label: '24° Spot' },
      { angle: 36, label: '36° Medium' },
      { angle: 60, label: '60° Wide' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard', ugrMax: 22, cutoff: null },
      { id: 'antiglare', label: 'Anti-Glare', ugrMax: 19, cutoff: 30 },
    ],
    ipOptions: ['IP20', 'IP65'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 90 },
      { id: 'premium', label: 'Premium', efficacy: 110 },
    ],
    protocols: ['ON/OFF', 'PHASE-CUT', '0-10V', 'DALI DT6'],
    swivel: true,
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 10. TRACK SPOTLIGHT ─────────────────────────────────────
  {
    id: 'track-spotlight',
    name: 'Track Spotlight',
    category: 'TRACK',
    mounting: 'Track',
    icon: '⊕',
    powerOptions: [5, 7, 10, 12, 15, 18, 20, 25, 30, 36],
    beamOptions: [
      { angle: 10, label: '10° Ultra Narrow' },
      { angle: 15, label: '15° Narrow' },
      { angle: 24, label: '24° Spot' },
      { angle: 36, label: '36° Medium' },
      { angle: 55, label: '55° Wide' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard', ugrMax: 22, cutoff: null },
      { id: 'antiglare', label: 'Anti-Glare', ugrMax: 19, cutoff: 30 },
    ],
    ipOptions: ['IP20'],
    cctOptions: [2700, 3000, 4000, 6500],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
      { value: 95, label: 'CRI 95' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 90 },
      { id: 'premium', label: 'Premium', efficacy: 110 },
      { id: 'ultra', label: 'Ultra', efficacy: 130 },
    ],
    trackVoltage: ['48V DC', '230V AC'],
    protocols: ['ON/OFF', '0-10V', 'DALI DT6', 'DALI DT8'],
    rotation: 355,
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 11. MAGNETIC TRACK SPOTLIGHT ────────────────────────────
  {
    id: 'magnetic-track-spotlight',
    name: 'Magnetic Track Spotlight',
    category: 'TRACK',
    mounting: 'Magnetic Track',
    icon: '⊗',
    powerOptions: [3, 5, 7, 9, 12, 15, 20],
    beamOptions: [
      { angle: 15, label: '15° Narrow' },
      { angle: 24, label: '24° Spot' },
      { angle: 36, label: '36° Medium' },
      { angle: 60, label: '60° Wide' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard', ugrMax: 22, cutoff: null },
      { id: 'antiglare', label: 'Anti-Glare', ugrMax: 19, cutoff: 30 },
    ],
    ipOptions: ['IP20'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 90, label: 'CRI 90' },
      { value: 95, label: 'CRI 95' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 90 },
      { id: 'premium', label: 'Premium', efficacy: 110 },
    ],
    trackSystems: ['7MM Superslim', '10MM', '20MM'],
    protocols: ['ON/OFF', 'DALI DT6'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 12. PENDANT / SUSPENDED SPOTLIGHT ───────────────────────
  {
    id: 'pendant-spotlight',
    name: 'Pendant Spotlight',
    category: 'PENDANT',
    mounting: 'Pendant',
    icon: '⊙',
    powerOptions: [5, 7, 10, 12, 13, 15, 18],
    beamOptions: [
      { angle: 18, label: '18° Narrow' },
      { angle: 24, label: '24° Spot' },
      { angle: 36, label: '36° Medium' },
      { angle: 80, label: '80° Wide' },
    ],
    glareOptions: [
      { id: 'antiglare', label: 'Anti-Glare', ugrMax: 19, cutoff: 30 },
    ],
    ipOptions: ['IP20', 'IP44'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 90, label: 'CRI 90' },
      { value: 95, label: 'CRI 95' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 95 },
      { id: 'premium', label: 'Premium', efficacy: 110 },
    ],
    protocols: ['ON/OFF', 'PHASE-CUT', '0-10V', 'DALI DT6'],
    cableLength: '2m (adjustable)',
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 13. LINEAR SPOTLIGHT / LASERBLADE ───────────────────────
  {
    id: 'linear-spotlight',
    name: 'Linear Spotlight',
    category: 'LINEAR',
    mounting: 'Recessed',
    icon: '▬',
    powerOptions: [3, 5, 6, 9, 10, 12, 15, 18, 20, 24, 30, 36],
    beamOptions: [
      { angle: 15, label: '15° Narrow' },
      { angle: 18, label: '18° Slot' },
      { angle: 24, label: '24° Spot' },
      { angle: 36, label: '36° Medium' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard', ugrMax: 22, cutoff: null },
      { id: 'antiglare', label: 'Anti-Glare', ugrMax: 19, cutoff: 30 },
    ],
    ipOptions: ['IP20'],
    cctOptions: [2700, 3000, 4000, 6500],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 90 },
      { id: 'premium', label: 'Premium', efficacy: 108 },
    ],
    protocols: ['ON/OFF', '0-10V', 'DALI DT6'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 14. LED PANEL ────────────────────────────────────────────
  {
    id: 'led-panel',
    name: 'LED Panel',
    category: 'PANEL',
    mounting: 'Recessed',
    icon: '▪',
    powerOptions: [18, 24, 36, 40, 48, 60],
    beamOptions: [
      { angle: 120, label: '120° Diffused' },
    ],
    glareOptions: [
      { id: 'diffuser', label: 'Diffuser Panel', ugrMax: 22, cutoff: null },
      { id: 'microprismatic', label: 'Microprismatic', ugrMax: 19, cutoff: null },
      { id: 'ugr-lt-19', label: 'UGR<19 Panel', ugrMax: 19, cutoff: null },
    ],
    sizeOptions: ['600×600', '1200×300', '1200×600', '600×300'],
    ipOptions: ['IP20', 'IP40'],
    cctOptions: [3000, 4000, 6500],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 100 },
      { id: 'premium', label: 'Premium', efficacy: 120 },
    ],
    protocols: ['ON/OFF', '0-10V', 'DALI DT6', 'DALI DT8'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 15. LINEAR DIFFUSED ─────────────────────────────────────
  {
    id: 'linear-diffused',
    name: 'Linear Diffused',
    category: 'LINEAR',
    mounting: 'Recessed / Surface / Pendant',
    icon: '═',
    powerOptions: [8, 10, 12, 15, 18, 20, 24, 30, 36],
    beamOptions: [
      { angle: 90, label: '90° Medium' },
      { angle: 110, label: '110° Wide' },
      { angle: 120, label: '120° Diffused' },
    ],
    glareOptions: [
      { id: 'diffuser', label: 'Opal Diffuser', ugrMax: 22, cutoff: null },
      { id: 'microprismatic', label: 'Microprismatic', ugrMax: 19, cutoff: null },
    ],
    ipOptions: ['IP20', 'IP44', 'IP65'],
    cctOptions: [2700, 3000, 4000, 6500],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 95 },
      { id: 'premium', label: 'Premium', efficacy: 115 },
    ],
    protocols: ['ON/OFF', 'PHASE-CUT', '0-10V', 'DALI DT6'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 16. COVE / LED STRIP ─────────────────────────────────────
  {
    id: 'cove-strip',
    name: 'Cove / LED Strip',
    category: 'STRIP',
    mounting: 'Cove / Surface',
    icon: '~',
    powerOptions: [5, 8, 10, 12, 14, 15, 19, 24, 30],
    beamOptions: [
      { angle: 120, label: '120° Indirect' },
      { angle: 15, label: '15° Wall Grazing' },
    ],
    glareOptions: [
      { id: 'indirect', label: 'Fully Indirect (Cove)', ugrMax: 99, cutoff: null },
      { id: 'lens-120', label: '120° Lens (2× brightness)', ugrMax: 99, cutoff: null },
      { id: 'lens-15', label: '15° Narrow Lens (Wall Grazing)', ugrMax: 99, cutoff: null },
    ],
    ipOptions: ['IP20', 'IP65', 'IP67'],
    cctOptions: [2700, 3000, 4000, 6500],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 80 },
      { id: 'premium', label: 'Premium', efficacy: 100 },
    ],
    protocols: ['ON/OFF', 'PHASE-CUT', '0-10V', 'DALI DT6'],
    unit: 'per metre',
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 17. HIGH BAY ─────────────────────────────────────────────
  {
    id: 'high-bay',
    name: 'High Bay',
    category: 'HIGH BAY',
    mounting: 'Pendant / Surface',
    icon: '◈',
    powerOptions: [50, 60, 80, 100, 120, 150, 200, 240],
    beamOptions: [
      { angle: 60, label: '60° Narrow' },
      { angle: 90, label: '90° Medium' },
      { angle: 120, label: '120° Wide' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard Reflector', ugrMax: 25, cutoff: null },
      { id: 'antiglare', label: 'Anti-Glare Hood', ugrMax: 22, cutoff: null },
    ],
    ipOptions: ['IP44', 'IP65'],
    cctOptions: [4000, 5000, 6500],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 130 },
      { id: 'premium', label: 'Premium', efficacy: 160 },
    ],
    protocols: ['ON/OFF', '0-10V', 'DALI DT6'],
    minCeilingHeight: 6,
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 18. STEP / FOOT LIGHT ───────────────────────────────────
  {
    id: 'step-light',
    name: 'Step / Foot Light',
    category: 'STEP LIGHT',
    mounting: 'Wall Recessed',
    icon: '↧',
    powerOptions: [1, 2, 3, 5],
    beamOptions: [
      { angle: 30, label: '30° Downward' },
      { angle: 45, label: '45° Downward' },
    ],
    glareOptions: [
      { id: 'concealed', label: 'Concealed (Glare-Free)', ugrMax: 99, cutoff: null },
    ],
    ipOptions: ['IP54', 'IP65'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 85 },
    ],
    protocols: ['ON/OFF'],
    installNote: 'Mount max 300mm from floor. Spacing 1m centres.',
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 19. OUTDOOR SPOTLIGHT ───────────────────────────────────
  {
    id: 'outdoor-spotlight',
    name: 'Outdoor Spotlight',
    category: 'OUTDOOR',
    mounting: 'Surface / Ground',
    icon: '🔦',
    powerOptions: [5, 8, 10, 12, 18, 20, 24, 30],
    beamOptions: [
      { angle: 1, label: '1° Ultra Narrow (Flood)' },
      { angle: 10, label: '10° Narrow' },
      { angle: 24, label: '24° Spot' },
      { angle: 36, label: '36° Medium' },
      { angle: 60, label: '60° Wide' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard Optic', ugrMax: 25, cutoff: null },
    ],
    ipOptions: ['IP65', 'IP66', 'IP67', 'IP68'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 100 },
      { id: 'premium', label: 'Premium', efficacy: 120 },
    ],
    protocols: ['ON/OFF', '0-10V'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

  // ─── 20. OUTDOOR IN-GROUND ───────────────────────────────────
  {
    id: 'inground-uplight',
    name: 'In-Ground Uplight',
    category: 'OUTDOOR',
    mounting: 'In-Ground',
    icon: '⬆',
    powerOptions: [1, 2, 5, 10, 12],
    beamOptions: [
      { angle: 10, label: '10° Narrow Uplighter' },
      { angle: 24, label: '24° Uplighter' },
      { angle: 36, label: '36° Wide Uplighter' },
    ],
    glareOptions: [
      { id: 'standard', label: 'Standard Optic', ugrMax: 25, cutoff: null },
    ],
    ipOptions: ['IP67', 'IP68'],
    cctOptions: [2700, 3000, 4000],
    criOptions: [
      { value: 80, label: 'CRI 80' },
      { value: 90, label: 'CRI 90' },
    ],
    chipOptions: [
      { id: 'standard', label: 'Standard', efficacy: 90 },
    ],
    protocols: ['ON/OFF'],
    calculateLumens: (watt, chip) => Math.round(watt * chip.efficacy),
  },

];

/**
 * Quick lookup by id
 */
export const FIXTURE_MAP = Object.fromEntries(
  CONFIGURABLE_FIXTURES.map(f => [f.id, f])
);

/**
 * Group by category for sidebar display
 */
export const FIXTURE_CATEGORIES = CONFIGURABLE_FIXTURES.reduce((acc, f) => {
  if (!acc[f.category]) acc[f.category] = [];
  acc[f.category].push(f);
  return acc;
}, {});

/**
 * Named exports for specific fixtures used in components
 */
export const COB_DOWNLIGHT = FIXTURE_MAP['cob-downlight'];
