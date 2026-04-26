// Indian branded fixture catalogue — PROFESSIONAL plan only
// Protocol values match system internals: 'DALI', 'PHASE-CUT' (=TRIAC), 'NON-DIM'

export const BRANDS = [
  {
    key: 'philips', name: 'PHILIPS',
    fixtures: [
      { id: 'ph-001', name: 'DuraSlim 7W',        watt: 7,  lumens: 735,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'ph-002', name: 'DuraSlim 12W',       watt: 12, lumens: 1260, beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'ph-003', name: 'DuraSlim 15W',       watt: 15, lumens: 1575, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'ph-004', name: 'DuraSlim 18W',       watt: 18, lumens: 1890, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'ph-005', name: 'DuraSlim 22W',       watt: 22, lumens: 2310, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'ph-006', name: 'Prime Plus 10W',     watt: 10, lumens: 1000, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'ph-007', name: 'Prime Plus 12W',     watt: 12, lumens: 1200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'ph-008', name: 'Prime Plus 15W',     watt: 15, lumens: 1500, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'ph-009', name: 'Prime Plus 22W',     watt: 22, lumens: 2200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'ph-010', name: 'CoreLine RC091V 25W',watt: 25, lumens: 2500, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'DALI'      },
      { id: 'ph-011', name: 'CoreLine RC091V 34W',watt: 34, lumens: 3400, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'DALI'      },
      { id: 'ph-012', name: 'Ledinaire RC065B 24W',watt: 24,lumens: 2400, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'ph-013', name: 'Ledinaire RC065B 36W',watt: 36,lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'ph-014', name: 'ModiFly SP800P 25W', watt: 25, lumens: 2500, beamAngle: 120, cct: '4000K', category: 'LINEAR',        protocol: 'DALI'      },
      { id: 'ph-015', name: 'ModiFly SP800P 40W', watt: 40, lumens: 4000, beamAngle: 120, cct: '4000K', category: 'LINEAR',        protocol: 'DALI'      },
    ],
  },
  {
    key: 'havells', name: 'HAVELLS',
    fixtures: [
      { id: 'hv-001', name: 'Joy Neo 3W',         watt: 3,  lumens: 270,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'hv-002', name: 'Joy Neo 5W',         watt: 5,  lumens: 450,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'hv-003', name: 'Joy Neo 9W',         watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'hv-004', name: 'Joy Neo 12W',        watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'hv-005', name: 'Joy Neo 18W',        watt: 18, lumens: 1620, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'hv-006', name: 'Joy Neo 24W',        watt: 24, lumens: 2160, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'hv-007', name: 'Lumeno 5W',          watt: 5,  lumens: 500,  beamAngle: 36,  cct: '6500K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'hv-008', name: 'Lumeno 10W',         watt: 10, lumens: 1000, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'hv-009', name: 'Lumeno 15W',         watt: 15, lumens: 1500, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'hv-010', name: 'Azstro COB 12W',     watt: 12, lumens: 1080, beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'hv-011', name: 'Azstro COB 18W',     watt: 18, lumens: 1620, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'hv-012', name: 'Innova Neo 10W',     watt: 10, lumens: 900,  beamAngle: 24,  cct: '3000K', category: 'SPOTLIGHT',     protocol: 'PHASE-CUT' },
      { id: 'hv-013', name: 'Innova Neo 15W',     watt: 15, lumens: 1350, beamAngle: 24,  cct: '3000K', category: 'SPOTLIGHT',     protocol: 'PHASE-CUT' },
      { id: 'hv-014', name: 'Cylindro Track 15W', watt: 15, lumens: 1275, beamAngle: 38,  cct: '3000K', category: 'TRACK_LIGHT',   protocol: 'PHASE-CUT' },
      { id: 'hv-015', name: 'Trim 18W',           watt: 18, lumens: 1620, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'hv-016', name: 'Trim 24W',           watt: 24, lumens: 2160, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'DALI'      },
    ],
  },
  {
    key: 'wipro', name: 'WIPRO',
    fixtures: [
      { id: 'wp-001', name: 'Garnet Alpha 7W',       watt: 7,  lumens: 700,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'wp-002', name: 'Garnet Alpha 10W',      watt: 10, lumens: 1000, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'wp-003', name: 'Garnet Alpha 12W',      watt: 12, lumens: 1200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'wp-004', name: 'Garnet COB Spot 9W',    watt: 9,  lumens: 810,  beamAngle: 40,  cct: '4000K', category: 'SPOTLIGHT',     protocol: 'PHASE-CUT' },
      { id: 'wp-005', name: 'Garnet COB Spot 12W',   watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'SPOTLIGHT',     protocol: 'PHASE-CUT' },
      { id: 'wp-006', name: 'Garnet Figo Track 10W', watt: 10, lumens: 850,  beamAngle: 36,  cct: '4000K', category: 'TRACK_LIGHT',   protocol: 'PHASE-CUT' },
      { id: 'wp-007', name: 'Garnet Figo Track 20W', watt: 20, lumens: 1700, beamAngle: 36,  cct: '4000K', category: 'TRACK_LIGHT',   protocol: 'PHASE-CUT' },
      { id: 'wp-008', name: 'Garnet Figo Track 30W', watt: 30, lumens: 2550, beamAngle: 36,  cct: '4000K', category: 'TRACK_LIGHT',   protocol: 'DALI'      },
      { id: 'wp-009', name: 'Garnet Wave 10W Round', watt: 10, lumens: 950,  beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'wp-010', name: 'Garnet Wave Slim 10W',  watt: 10, lumens: 900,  beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'wp-011', name: 'Garnet Wave Slim 20W',  watt: 20, lumens: 1800, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'DALI'      },
      { id: 'wp-012', name: 'Commercial 2x2 36W',    watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'DALI'      },
    ],
  },
  {
    key: 'syska', name: 'SYSKA',
    fixtures: [
      { id: 'sy-001', name: 'SSK-DL-5W',         watt: 5,  lumens: 450,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'sy-002', name: 'SSK-DL-7W',         watt: 7,  lumens: 630,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'sy-003', name: 'SSK-DL-9W',         watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'sy-004', name: 'SSK-DL-12W',        watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'sy-005', name: 'SSK-DL-15W',        watt: 15, lumens: 1350, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'sy-006', name: 'SSK-DL-18W',        watt: 18, lumens: 1620, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'sy-007', name: 'SSK-PL-12W Round',  watt: 12, lumens: 1080, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'NON-DIM'   },
      { id: 'sy-008', name: 'SSK-PL-18W Square', watt: 18, lumens: 1620, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'sy-009', name: 'SSK-PL-24W Square', watt: 24, lumens: 2160, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'sy-010', name: 'SSK-PL-36W 2x2',    watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'sy-011', name: 'SSK-FL-20W Flood',  watt: 20, lumens: 1800, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT',   protocol: 'NON-DIM'   },
      { id: 'sy-012', name: 'SSK-FL-30W Flood',  watt: 30, lumens: 2700, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT',   protocol: 'NON-DIM'   },
      { id: 'sy-013', name: 'SSK-FL-50W Flood',  watt: 50, lumens: 4500, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT',   protocol: 'NON-DIM'   },
    ],
  },
  {
    key: 'crompton', name: 'CROMPTON',
    fixtures: [
      { id: 'cr-001', name: 'Primio Neo 5W',    watt: 5,  lumens: 450,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'cr-002', name: 'Primio Neo 7W',    watt: 7,  lumens: 630,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'cr-003', name: 'Primio Neo 9W',    watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'cr-004', name: 'Primio Neo 12W',   watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'cr-005', name: 'Primio Neo 15W',   watt: 15, lumens: 1350, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'cr-006', name: 'Smart Panel 12W',  watt: 12, lumens: 1080, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'NON-DIM'   },
      { id: 'cr-007', name: 'Smart Panel 18W',  watt: 18, lumens: 1620, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'cr-008', name: 'Smart Panel 24W',  watt: 24, lumens: 2160, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'cr-009', name: 'Backlit Panel 36W',watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
    ],
  },
  {
    key: 'bajaj', name: 'BAJAJ',
    fixtures: [
      { id: 'bj-001', name: 'Ledure 5W',           watt: 5,  lumens: 450,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'bj-002', name: 'Ledure 7W',           watt: 7,  lumens: 630,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'bj-003', name: 'Ledure 9W',           watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'bj-004', name: 'Ledure 12W',          watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'bj-005', name: 'Ledure 15W',          watt: 15, lumens: 1350, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'bj-006', name: 'Celesta Modular 12W', watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'bj-007', name: 'Edgeline 18W',        watt: 18, lumens: 1620, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'bj-008', name: 'Edgeline 24W',        watt: 24, lumens: 2160, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'bj-009', name: 'Edgeline 36W 2x2',   watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'bj-010', name: 'Eyecare Panel 36W',   watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'DALI'      },
      { id: 'bj-011', name: 'Ledure Batten 20W',   watt: 20, lumens: 1800, beamAngle: 120, cct: '6500K', category: 'LINEAR',        protocol: 'NON-DIM'   },
      { id: 'bj-012', name: 'Ledure Batten 36W',   watt: 36, lumens: 3600, beamAngle: 120, cct: '6500K', category: 'LINEAR',        protocol: 'NON-DIM'   },
      { id: 'bj-013', name: 'Starlite 20W Flood',  watt: 20, lumens: 1800, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT',   protocol: 'NON-DIM'   },
      { id: 'bj-014', name: 'Starlite 30W Flood',  watt: 30, lumens: 2700, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT',   protocol: 'NON-DIM'   },
      { id: 'bj-015', name: 'Starlite 50W Flood',  watt: 50, lumens: 4500, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT',   protocol: 'NON-DIM'   },
    ],
  },
  {
    key: 'osram', name: 'OSRAM',
    fixtures: [
      { id: 'os-001', name: 'Ledinaire DN065B 7W',  watt: 7,  lumens: 700,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'os-002', name: 'Ledinaire DN065B 12W', watt: 12, lumens: 1200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'os-003', name: 'Ledinaire DN065B 17W', watt: 17, lumens: 1700, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'os-004', name: 'Valuefit DN 9W',       watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'os-005', name: 'Valuefit DN 13W',      watt: 13, lumens: 1200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'os-006', name: 'Ledinaire Panel 25W',  watt: 25, lumens: 2500, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'os-007', name: 'Ledinaire Panel 34W',  watt: 34, lumens: 3400, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'DALI'      },
      { id: 'os-008', name: 'Planon Plus 36W',      watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'DALI'      },
    ],
  },
  {
    key: 'orient', name: 'ORIENT',
    fixtures: [
      { id: 'or-001', name: 'Moonlite 6W',       watt: 6,  lumens: 540,  beamAngle: 36,  cct: '6500K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'or-002', name: 'Moonlite 9W',       watt: 9,  lumens: 765,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'or-003', name: 'Eternal 9W Slim',   watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'or-004', name: 'Eternal 12W',       watt: 12, lumens: 1080, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'or-005', name: 'COB Spot 3W',       watt: 3,  lumens: 240,  beamAngle: 40,  cct: '3000K', category: 'SPOTLIGHT',     protocol: 'NON-DIM'   },
      { id: 'or-006', name: 'COB Spot 6W',       watt: 6,  lumens: 510,  beamAngle: 40,  cct: '4000K', category: 'SPOTLIGHT',     protocol: 'NON-DIM'   },
      { id: 'or-007', name: 'COB Spot 9W',       watt: 9,  lumens: 765,  beamAngle: 40,  cct: '4000K', category: 'SPOTLIGHT',     protocol: 'PHASE-CUT' },
      { id: 'or-008', name: 'COB Spot 12W',      watt: 12, lumens: 1020, beamAngle: 40,  cct: '4000K', category: 'SPOTLIGHT',     protocol: 'PHASE-CUT' },
      { id: 'or-009', name: 'Rimless Panel 12W', watt: 12, lumens: 1200, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'or-010', name: 'Rimless Panel 18W', watt: 18, lumens: 1620, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'or-011', name: 'Eternal Flood 50W', watt: 50, lumens: 4500, beamAngle: 120, cct: '6500K', category: 'FLOOD_LIGHT',   protocol: 'NON-DIM'   },
    ],
  },
  {
    key: 'jaquar', name: 'JAQUAR',
    fixtures: [
      { id: 'jq-001', name: 'Neve Surface 6W',   watt: 6,  lumens: 450,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'jq-002', name: 'Neve Surface 12W',  watt: 12, lumens: 900,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'jq-003', name: 'Areva Prime 9W',    watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'jq-004', name: 'Areva Prime 15W',   watt: 15, lumens: 1350, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'jq-005', name: 'Lucent Slim 9W',    watt: 9,  lumens: 810,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'jq-006', name: 'Lucent Slim 18W',   watt: 18, lumens: 1620, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'jq-007', name: 'Gem Blaze 6W',      watt: 6,  lumens: 540,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'jq-008', name: 'Striker Mini 3W',   watt: 3,  lumens: 270,  beamAngle: 36,  cct: '3000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'jq-009', name: 'Track Light 10W',   watt: 10, lumens: 850,  beamAngle: 36,  cct: '3000K', category: 'TRACK_LIGHT',   protocol: 'PHASE-CUT' },
      { id: 'jq-010', name: 'Track Light 20W',   watt: 20, lumens: 1700, beamAngle: 36,  cct: '4000K', category: 'TRACK_LIGHT',   protocol: 'PHASE-CUT' },
      { id: 'jq-011', name: 'Panel 24W Square',  watt: 24, lumens: 2160, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'jq-012', name: 'Panel 36W 2x2',     watt: 36, lumens: 3600, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'DALI'      },
    ],
  },
  {
    key: 'hybec', name: 'HYBEC',
    fixtures: [
      { id: 'hy-001', name: 'HLR-2637 9W',        watt: 9,  lumens: 720,  beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'NON-DIM'   },
      { id: 'hy-002', name: 'HLR-2638 15W',        watt: 15, lumens: 1200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'hy-003', name: 'HLR-2639 20W',        watt: 20, lumens: 1600, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'PHASE-CUT' },
      { id: 'hy-004', name: 'HLR-2660 40W',        watt: 40, lumens: 3200, beamAngle: 36,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'hy-005', name: 'HLR-2663 40W Wide',   watt: 40, lumens: 3200, beamAngle: 60,  cct: '4000K', category: 'COB_DOWNLIGHT', protocol: 'DALI'      },
      { id: 'hy-006', name: 'HLM-2011 30W Module', watt: 30, lumens: 2400, beamAngle: 120, cct: '4000K', category: 'PANEL',         protocol: 'PHASE-CUT' },
      { id: 'hy-007', name: 'Panel 15W Square',    watt: 15, lumens: 1350, beamAngle: 120, cct: '6500K', category: 'PANEL',         protocol: 'NON-DIM'   },
      { id: 'hy-008', name: 'Panel 35W Round',     watt: 35, lumens: 3150, beamAngle: 120, cct: '3000K', category: 'SURFACE_PANEL', protocol: 'NON-DIM'   },
    ],
  },
]

// Flat list for filtering
export const ALL_BRANDED = BRANDS.flatMap(b =>
  b.fixtures.map(f => ({ ...f, brand: b.name, brandKey: b.key }))
)

export const BRAND_NAMES = BRANDS.map(b => b.name)

export const BRANDED_CATEGORIES = [...new Set(ALL_BRANDED.map(f => f.category))]

export const PROTO_LABEL = {
  'DALI':      'DALI',
  'PHASE-CUT': 'TRIAC',
  'NON-DIM':   'ND',
}

export const PROTO_COLOR = {
  'DALI':      '#00d4ff',
  'PHASE-CUT': '#ff9940',
  'NON-DIM':   '#666',
}
