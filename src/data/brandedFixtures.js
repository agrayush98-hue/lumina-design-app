// Indian branded fixture catalogue — PROFESSIONAL plan only
// Protocol is not stored per-fixture; set by user via inspector dropdown (default TRIAC)

export const BRANDS = [
  {
    key: 'philips', name: 'PHILIPS',
    fixtures: [
      // COB Downlights
      { id: 'ph-001', name: 'DuraSlim 7W',             watt: 7,  lumens: 735,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-002', name: 'DuraSlim 12W',            watt: 12, lumens: 1260, beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-003', name: 'DuraSlim 15W',            watt: 15, lumens: 1575, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-004', name: 'DuraSlim 18W',            watt: 18, lumens: 1890, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-005', name: 'DuraSlim 22W',            watt: 22, lumens: 2310, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-006', name: 'Prime Plus 10W',          watt: 10, lumens: 1000, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-007', name: 'Prime Plus 12W',          watt: 12, lumens: 1200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-008', name: 'Prime Plus 15W',          watt: 15, lumens: 1500, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-009', name: 'Prime Plus 18W',          watt: 18, lumens: 1800, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-010', name: 'Prime Plus 22W',          watt: 22, lumens: 2200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-011', name: 'Max Plus 10W',            watt: 10, lumens: 1050, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-012', name: 'Max Plus 15W',            watt: 15, lumens: 1575, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'ph-013', name: 'Max Plus 18W',            watt: 18, lumens: 1890, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      // Panels
      { id: 'ph-014', name: 'CoreLine RC091V 25W',     watt: 25, lumens: 2500, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'ph-015', name: 'CoreLine RC091V 34W',     watt: 34, lumens: 3400, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'ph-016', name: 'Ledinaire RC065B 24W',    watt: 24, lumens: 2400, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'ph-017', name: 'Ledinaire RC065B 36W',    watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'ph-018', name: 'Ledinaire RC065B 40W',    watt: 40, lumens: 4000, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      // Linear
      { id: 'ph-019', name: 'ModiFly SP800P 18W',      watt: 18, lumens: 1800, beamAngle: 120, cct: '4000K', category: 'LINEAR' },
      { id: 'ph-020', name: 'ModiFly SP800P 25W',      watt: 25, lumens: 2500, beamAngle: 120, cct: '4000K', category: 'LINEAR' },
      { id: 'ph-021', name: 'ModiFly SP800P 36W',      watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'LINEAR' },
      { id: 'ph-022', name: 'ModiFly SP800P 40W',      watt: 40, lumens: 4000, beamAngle: 120, cct: '4000K', category: 'LINEAR' },
      // LED Strips (watt/lumens are per-metre values)
      { id: 'ph-023', name: 'LV09 Strip 10W/m',        watt: 10, lumens: 1000, beamAngle: 120, cct: '3000K', category: 'LED_STRIP' },
      { id: 'ph-024', name: 'LV09 Strip 14W/m',        watt: 14, lumens: 1400, beamAngle: 120, cct: '4000K', category: 'LED_STRIP' },
      { id: 'ph-025', name: 'LV09 Strip 20W/m',        watt: 20, lumens: 2000, beamAngle: 120, cct: '4000K', category: 'LED_STRIP' },
    ],
  },
  {
    key: 'havells', name: 'HAVELLS',
    fixtures: [
      // COB Downlights
      { id: 'hv-001', name: 'Joy Neo 3W',              watt: 3,  lumens: 270,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-002', name: 'Joy Neo 5W',              watt: 5,  lumens: 450,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-003', name: 'Joy Neo 9W',              watt: 9,  lumens: 810,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-004', name: 'Joy Neo 12W',             watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-005', name: 'Joy Neo 18W',             watt: 18, lumens: 1620, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-006', name: 'Joy Neo 24W',             watt: 24, lumens: 2160, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-007', name: 'Lumeno 5W',               watt: 5,  lumens: 500,  beamAngle: 36,  cct: '6500K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-008', name: 'Lumeno 8W',               watt: 8,  lumens: 800,  beamAngle: 36,  cct: '6500K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-009', name: 'Lumeno 10W',              watt: 10, lumens: 1000, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-010', name: 'Lumeno 15W',              watt: 15, lumens: 1500, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-011', name: 'Azstro COB 12W',          watt: 12, lumens: 1080, beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-012', name: 'Azstro COB 18W',          watt: 18, lumens: 1620, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'hv-013', name: 'Azstro COB 24W',          watt: 24, lumens: 2160, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      // Spotlights
      { id: 'hv-014', name: 'Innova Neo 7W',           watt: 7,  lumens: 630,  beamAngle: 24,  cct: '3000K', category: 'SPOTLIGHT' },
      { id: 'hv-015', name: 'Innova Neo 10W',          watt: 10, lumens: 900,  beamAngle: 24,  cct: '3000K', category: 'SPOTLIGHT' },
      { id: 'hv-016', name: 'Innova Neo 15W',          watt: 15, lumens: 1350, beamAngle: 24,  cct: '3000K', category: 'SPOTLIGHT' },
      { id: 'hv-017', name: 'Innova Neo 20W',          watt: 20, lumens: 1800, beamAngle: 24,  cct: '4000K', category: 'SPOTLIGHT' },
      // Track
      { id: 'hv-018', name: 'Cylindro Track 10W',      watt: 10, lumens: 850,  beamAngle: 38,  cct: '3000K', category: 'TRACK_LIGHT' },
      { id: 'hv-019', name: 'Cylindro Track 15W',      watt: 15, lumens: 1275, beamAngle: 38,  cct: '3000K', category: 'TRACK_LIGHT' },
      { id: 'hv-020', name: 'Cylindro Track 20W',      watt: 20, lumens: 1700, beamAngle: 38,  cct: '4000K', category: 'TRACK_LIGHT' },
      // Panels
      { id: 'hv-021', name: 'Trim 12W',                watt: 12, lumens: 1080, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'hv-022', name: 'Trim 18W',                watt: 18, lumens: 1620, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'hv-023', name: 'Trim 24W',                watt: 24, lumens: 2160, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'hv-024', name: 'Trim 36W',                watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'hv-025', name: 'Smart CCT 10W',           watt: 10, lumens: 900,  beamAngle: 120, cct: 'Tunable', category: 'PANEL' },
      { id: 'hv-026', name: 'Smart CCT 15W',           watt: 15, lumens: 1350, beamAngle: 120, cct: 'Tunable', category: 'PANEL' },
      // LED Strips
      { id: 'hv-027', name: 'Azure Strip 10W/m',       watt: 10, lumens: 1000, beamAngle: 120, cct: '3000K', category: 'LED_STRIP' },
      { id: 'hv-028', name: 'Azure Strip 14W/m',       watt: 14, lumens: 1400, beamAngle: 120, cct: '3000K', category: 'LED_STRIP' },
      { id: 'hv-029', name: 'Azure Strip 18W/m',       watt: 18, lumens: 1800, beamAngle: 120, cct: '4000K', category: 'LED_STRIP' },
    ],
  },
  {
    key: 'wipro', name: 'WIPRO',
    fixtures: [
      // COB Downlights
      { id: 'wp-001', name: 'Garnet Alpha 5W',         watt: 5,  lumens: 450,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'wp-002', name: 'Garnet Alpha 7W',         watt: 7,  lumens: 700,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'wp-003', name: 'Garnet Alpha 10W',        watt: 10, lumens: 1000, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'wp-004', name: 'Garnet Alpha 12W',        watt: 12, lumens: 1200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'wp-005', name: 'Garnet Alpha 15W',        watt: 15, lumens: 1350, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      // Spotlights
      { id: 'wp-006', name: 'Garnet COB Spot 9W',      watt: 9,  lumens: 810,  beamAngle: 40,  cct: '4000K', category: 'SPOTLIGHT' },
      { id: 'wp-007', name: 'Garnet COB Spot 12W',     watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'SPOTLIGHT' },
      { id: 'wp-008', name: 'Garnet COB Spot 15W',     watt: 15, lumens: 1350, beamAngle: 36,  cct: '4000K', category: 'SPOTLIGHT' },
      // Track
      { id: 'wp-009', name: 'Garnet Figo Track 10W',   watt: 10, lumens: 850,  beamAngle: 36,  cct: '4000K', category: 'TRACK_LIGHT' },
      { id: 'wp-010', name: 'Garnet Figo Track 20W',   watt: 20, lumens: 1700, beamAngle: 36,  cct: '4000K', category: 'TRACK_LIGHT' },
      { id: 'wp-011', name: 'Garnet Figo Track 30W',   watt: 30, lumens: 2550, beamAngle: 36,  cct: '4000K', category: 'TRACK_LIGHT' },
      // Panels
      { id: 'wp-012', name: 'Garnet Wave 7W Round',    watt: 7,  lumens: 700,  beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'wp-013', name: 'Garnet Wave 10W Round',   watt: 10, lumens: 950,  beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'wp-014', name: 'Garnet Wave 12W Square',  watt: 12, lumens: 1080, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'wp-015', name: 'Garnet Slim Edge 10W',    watt: 10, lumens: 900,  beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'wp-016', name: 'Garnet Slim Edge 20W',    watt: 20, lumens: 1800, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'wp-017', name: 'Commercial 2x2 36W',      watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'wp-018', name: 'Commercial 2x2 40W',      watt: 40, lumens: 4000, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      // Wall Washers
      { id: 'wp-019', name: 'Garnet U/D Wall 6W',      watt: 6,  lumens: 540,  beamAngle: 120, cct: '2700K', category: 'WALL_WASHER' },
      { id: 'wp-020', name: 'Garnet U/D Wall 10W',     watt: 10, lumens: 900,  beamAngle: 120, cct: '3000K', category: 'WALL_WASHER' },
    ],
  },
  {
    key: 'orient', name: 'ORIENT',
    fixtures: [
      // COB Downlights
      { id: 'or-001', name: 'Moonlite 3W',             watt: 3,  lumens: 270,  beamAngle: 36,  cct: '6500K', category: 'COB_DOWNLIGHT' },
      { id: 'or-002', name: 'Moonlite 6W',             watt: 6,  lumens: 540,  beamAngle: 36,  cct: '6500K', category: 'COB_DOWNLIGHT' },
      { id: 'or-003', name: 'Moonlite 9W',             watt: 9,  lumens: 765,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'or-004', name: 'Eternal 9W Slim',         watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'or-005', name: 'Eternal 12W',             watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'or-006', name: 'Eternal 15W',             watt: 15, lumens: 1350, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      // Spotlights
      { id: 'or-007', name: 'COB Spot 3W',             watt: 3,  lumens: 240,  beamAngle: 40,  cct: '3000K', category: 'SPOTLIGHT' },
      { id: 'or-008', name: 'COB Spot 6W',             watt: 6,  lumens: 510,  beamAngle: 40,  cct: '4000K', category: 'SPOTLIGHT' },
      { id: 'or-009', name: 'COB Spot 9W',             watt: 9,  lumens: 765,  beamAngle: 40,  cct: '4000K', category: 'SPOTLIGHT' },
      { id: 'or-010', name: 'COB Spot 12W',            watt: 12, lumens: 1020, beamAngle: 40,  cct: '4000K', category: 'SPOTLIGHT' },
      { id: 'or-011', name: 'Flexi Spot 5W',           watt: 5,  lumens: 350,  beamAngle: 20,  cct: '3000K', category: 'SPOTLIGHT' },
      { id: 'or-012', name: 'Flexi Spot 7W',           watt: 7,  lumens: 490,  beamAngle: 20,  cct: '4000K', category: 'SPOTLIGHT' },
      // Panels
      { id: 'or-013', name: 'Rimless Panel 12W Round', watt: 12, lumens: 1200, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'or-014', name: 'Rimless Panel 18W Square',watt: 18, lumens: 1620, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'or-015', name: 'Rimless Panel 24W Square',watt: 24, lumens: 2160, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'or-016', name: 'Rimless Panel 36W 2x2',   watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      // Flood Lights
      { id: 'or-017', name: 'Eternal Flood 20W',       watt: 20, lumens: 1800, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT' },
      { id: 'or-018', name: 'Eternal Flood 30W',       watt: 30, lumens: 2700, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT' },
      { id: 'or-019', name: 'Eternal Flood 50W',       watt: 50, lumens: 4500, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT' },
    ],
  },
  {
    key: 'jaquar', name: 'JAQUAR',
    fixtures: [
      // COB Downlights
      { id: 'jq-001', name: 'Neve Surface 3W',         watt: 3,  lumens: 225,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-002', name: 'Neve Surface 6W',         watt: 6,  lumens: 450,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-003', name: 'Neve Surface 12W',        watt: 12, lumens: 900,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-004', name: 'Areva Prime 9W',          watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-005', name: 'Areva Prime 12W',         watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-006', name: 'Areva Prime 15W',         watt: 15, lumens: 1350, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-007', name: 'Areva Prime 18W',         watt: 18, lumens: 1620, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-008', name: 'Lucent Slim 9W',          watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-009', name: 'Lucent Slim 12W',         watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-010', name: 'Lucent Slim 18W',         watt: 18, lumens: 1620, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-011', name: 'Gem Blaze 6W',            watt: 6,  lumens: 540,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-012', name: 'Gem Blaze 12W',           watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-013', name: 'Striker Mini 3W',         watt: 3,  lumens: 270,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-014', name: 'Striker Mini 6W',         watt: 6,  lumens: 540,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-015', name: 'Ensave Plus 9W',          watt: 9,  lumens: 810,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'jq-016', name: 'Ensave Plus 15W',         watt: 15, lumens: 1350, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      // Track
      { id: 'jq-017', name: 'Jaquar Track 10W',        watt: 10, lumens: 850,  beamAngle: 36,  cct: '3000K', category: 'TRACK_LIGHT' },
      { id: 'jq-018', name: 'Jaquar Track 15W',        watt: 15, lumens: 1275, beamAngle: 36,  cct: '4000K', category: 'TRACK_LIGHT' },
      { id: 'jq-019', name: 'Jaquar Track 20W',        watt: 20, lumens: 1700, beamAngle: 36,  cct: '4000K', category: 'TRACK_LIGHT' },
      { id: 'jq-020', name: 'Jaquar Track 30W',        watt: 30, lumens: 2550, beamAngle: 36,  cct: '4000K', category: 'TRACK_LIGHT' },
      // Panels
      { id: 'jq-021', name: 'Panel 12W Square',        watt: 12, lumens: 1080, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'jq-022', name: 'Panel 18W Square',        watt: 18, lumens: 1620, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'jq-023', name: 'Panel 24W Square',        watt: 24, lumens: 2160, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'jq-024', name: 'Panel 36W 2x2',           watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'jq-025', name: 'Panel 40W 2x2',           watt: 40, lumens: 4000, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      // Wall Washers
      { id: 'jq-026', name: 'Wall Washer 12W',         watt: 12, lumens: 1080, beamAngle: 75,  cct: '3000K', category: 'WALL_WASHER' },
      { id: 'jq-027', name: 'Wall Washer 18W',         watt: 18, lumens: 1620, beamAngle: 75,  cct: '3000K', category: 'WALL_WASHER' },
      { id: 'jq-028', name: 'Wall Washer 24W',         watt: 24, lumens: 2160, beamAngle: 75,  cct: '4000K', category: 'WALL_WASHER' },
    ],
  },
  {
    key: 'osram', name: 'OSRAM',
    fixtures: [
      // COB Downlights
      { id: 'os-001', name: 'Ledinaire DN065B 7W',     watt: 7,  lumens: 700,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'os-002', name: 'Ledinaire DN065B 10W',    watt: 10, lumens: 1000, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'os-003', name: 'Ledinaire DN065B 12W',    watt: 12, lumens: 1200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'os-004', name: 'Ledinaire DN065B 17W',    watt: 17, lumens: 1700, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'os-005', name: 'Ledinaire DN065B 20W',    watt: 20, lumens: 2000, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'os-006', name: 'Valuefit DN 9W',          watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'os-007', name: 'Valuefit DN 13W',         watt: 13, lumens: 1200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      { id: 'os-008', name: 'Valuefit DN 16W',         watt: 16, lumens: 1500, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT' },
      // Panels
      { id: 'os-009', name: 'Ledinaire Panel 25W',     watt: 25, lumens: 2500, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'os-010', name: 'Ledinaire Panel 34W',     watt: 34, lumens: 3400, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'os-011', name: 'Ledinaire Panel 40W',     watt: 40, lumens: 4000, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'os-012', name: 'Planon Plus 36W',         watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      { id: 'os-013', name: 'Planon Plus 44W',         watt: 44, lumens: 4400, beamAngle: 120, cct: '4000K', category: 'PANEL' },
      // Linear
      { id: 'os-014', name: 'SubstiTUBE 18W 4ft',     watt: 18, lumens: 2000, beamAngle: 120, cct: '4000K', category: 'LINEAR' },
      { id: 'os-015', name: 'SubstiTUBE 24W 5ft',     watt: 24, lumens: 2500, beamAngle: 120, cct: '4000K', category: 'LINEAR' },
      { id: 'os-016', name: 'Ledvance Batten 20W',    watt: 20, lumens: 2000, beamAngle: 120, cct: '6500K', category: 'LINEAR' },
      { id: 'os-017', name: 'Ledvance Batten 36W',    watt: 36, lumens: 3600, beamAngle: 120, cct: '6500K', category: 'LINEAR' },
    ],
  },
  {
    key: 'hybec', name: 'HYBEC',
    fixtures: [
      // Fixed COB Downlights
      { id: 'hb-001', name: 'HLR-2361 7W',             watt: 7,  lumens: 630,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hb-002', name: 'HLR-2362 12W',            watt: 12, lumens: 1080, beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hb-003', name: 'Elite Fixed 18W',          watt: 18, lumens: 1620, beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hb-004', name: 'Elite Fixed 25W',          watt: 25, lumens: 2250, beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hb-005', name: 'Elite Fixed 30W',          watt: 30, lumens: 2700, beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hb-006', name: 'Elite Fixed 35W',          watt: 35, lumens: 3150, beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      // Anti-Glare
      { id: 'hb-007', name: 'HLR-2898 Anti-glare 7W',  watt: 7,  lumens: 630,  beamAngle: 40,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hb-008', name: 'HLR-2899 Anti-glare 15W', watt: 15, lumens: 1350, beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      // Grille Series
      { id: 'hb-009', name: 'HLR-2608 Grille 1x15W',   watt: 15, lumens: 1425, beamAngle: 40,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hb-010', name: 'HLR-2608 Grille 2x15W',   watt: 30, lumens: 3100, beamAngle: 40,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      { id: 'hb-011', name: 'HLR-2608 Grille 3x15W',   watt: 45, lumens: 4700, beamAngle: 40,  cct: '3000K', category: 'COB_DOWNLIGHT' },
      // Tiltable (Spotlight)
      { id: 'hb-012', name: 'Elite Tiltable 8W',        watt: 8,  lumens: 720,  beamAngle: 24,  cct: '3000K', category: 'SPOTLIGHT' },
      { id: 'hb-013', name: 'Elite Tiltable 30W',       watt: 30, lumens: 2700, beamAngle: 24,  cct: '3000K', category: 'SPOTLIGHT' },
      { id: 'hb-014', name: 'Elite Tiltable 35W',       watt: 35, lumens: 3150, beamAngle: 24,  cct: '3000K', category: 'SPOTLIGHT' },
      // Track Lights
      { id: 'hb-015', name: 'Elite Track 18W',          watt: 18, lumens: 1620, beamAngle: 36,  cct: '3000K', category: 'TRACK_LIGHT' },
      { id: 'hb-016', name: 'Elite Track 25W',          watt: 25, lumens: 2250, beamAngle: 36,  cct: '3000K', category: 'TRACK_LIGHT' },
      { id: 'hb-017', name: 'Elite Track 30W',          watt: 30, lumens: 2700, beamAngle: 38,  cct: '3000K', category: 'TRACK_LIGHT' },
      { id: 'hb-018', name: 'Elite Track 35W',          watt: 35, lumens: 3150, beamAngle: 38,  cct: '3000K', category: 'TRACK_LIGHT' },
      { id: 'hb-019', name: 'Elite Track 2x30W',        watt: 60, lumens: 5400, beamAngle: 38,  cct: '3000K', category: 'TRACK_LIGHT' },
      // Panels / Modules
      { id: 'hb-020', name: 'HLM-2133 Module 33W',      watt: 33, lumens: 2970, beamAngle: 120, cct: '3000K', category: 'PANEL' },
      { id: 'hb-021', name: 'HLM-2133 Module 40W',      watt: 40, lumens: 3600, beamAngle: 120, cct: '3000K', category: 'PANEL' },
      { id: 'hb-022', name: 'Elite Panel 15W',           watt: 15, lumens: 1350, beamAngle: 120, cct: '6500K', category: 'PANEL' },
      { id: 'hb-023', name: 'Elite Panel 35W Round',     watt: 35, lumens: 3150, beamAngle: 120, cct: '3000K', category: 'SURFACE_PANEL' },
      // Wall Washers
      { id: 'hb-024', name: 'Elite Wall Washer 18W',     watt: 18, lumens: 1620, beamAngle: 75,  cct: '3000K', category: 'WALL_WASHER' },
      { id: 'hb-025', name: 'Elite Wall Washer 25W',     watt: 25, lumens: 2250, beamAngle: 75,  cct: '3000K', category: 'WALL_WASHER' },
      // Flood Lights
      { id: 'hb-026', name: 'Elite Flood 20W',           watt: 20, lumens: 1800, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT' },
      { id: 'hb-027', name: 'Elite Flood 30W',           watt: 30, lumens: 2700, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT' },
      { id: 'hb-028', name: 'Elite Flood 50W',           watt: 50, lumens: 4500, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT' },
    ],
  },
]

export const ALL_BRANDED      = BRANDS.flatMap(b => b.fixtures.map(f => ({ ...f, brand: b.name, brandKey: b.key })))
export const BRAND_NAMES      = BRANDS.map(b => b.name)
export const BRANDED_CATEGORIES = [...new Set(ALL_BRANDED.map(f => f.category))]

export const PROTO_OPTIONS = [
  { value: 'NON-DIM',   label: 'NON-DIM' },
  { value: 'PHASE-CUT', label: 'TRIAC'   },
  { value: 'DALI',      label: 'DALI'    },
]
