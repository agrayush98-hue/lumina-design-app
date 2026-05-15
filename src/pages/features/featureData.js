/**
 * Content data for all /features/:slug pages.
 * Each entry maps directly to one route.
 */

export const FEATURE_DATA = {
  'lux-calculation': {
    slug:      'lux-calculation',
    tag:       'LUX ENGINE',
    title:     'Real-Time Lux Calculation Software',
    subtitle:  'The IES Lumen Method calculated instantly. Every fixture placement updates the room average, grid values, and compliance status in under 100ms.',
    seoTitle:  'Lux Calculation Software Online — Real-Time IES Lumen Method | Lumina Design',
    seoDesc:   'Free online lux calculation software using the IES Lumen Method. Calculate average illuminance, uniformity ratio, and EN 12464-1 compliance in real time. Free trial.',
    canonical: 'https://app.lightillumina.com/features/lux-calculation',
    stat:      '±2%',
    statLabel: 'Calculation accuracy',
    sections: [
      {
        heading: 'How the lux engine works',
        body: 'Lumina uses the zonal cavity method (IES Lumen Method) — the industry standard for average illuminance calculation. Unlike point-by-point methods that require photometric files, the lumen method gives reliable average lux values from fixture lumens, room geometry, and surface reflectances alone.',
        bullets: [
          'Room Cavity Ratio (RCR) calculated from length, width, and ceiling height',
          'Utilisation Factor (UF) derived from RCR and reflectance values (ceiling 0.7, walls 0.5, floor 0.2)',
          'Maintenance Factor (MF) default 0.80 per CIBSE / EN 12464-1',
          'Average lux = (N × Φ × UF × MF) / Area — updated on every fixture change',
        ],
      },
      {
        heading: 'Compliance checking built in',
        body: 'Every room shows a live status indicator — GOOD, OVERLIT, or UNDERLIT — compared against your target lux level. Target values follow EN 12464-1 defaults by room type (offices: 500 lux, corridors: 100 lux, etc.) and can be overridden per project.',
        bullets: [
          'EN 12464-1 lux targets by room type',
          'NBC India 2016 reference values',
          'Custom target lux override per room',
          'Colour-coded status: green (GOOD), amber (UNDERLIT), red (OVERLIT)',
        ],
      },
      {
        heading: 'What the calculation covers',
        body: 'The engine calculates average maintained illuminance across the working plane. It accounts for all fixtures in the room simultaneously — not just a single fixture — giving you the whole-room picture that clients and approval documents require.',
        bullets: [
          'Average maintained illuminance (Ēm) across working plane',
          'Per-fixture contribution to room average',
          'Nadir lux estimate per fixture (cd / d²)',
          'Instant recalculation on fixture add, remove, or edit',
        ],
      },
      {
        heading: 'What it does not replace',
        body: 'The lumen method gives reliable average values but does not replace point-by-point photometric calculations for critical applications (operating theatres, precision manufacturing). For those projects, use Lumina to design the layout and validate with DIALux evo using IES/LDT files.',
        bullets: [
          'Average illuminance only — not per-point grid values',
          'No photometric file (IES/LDT) required',
          'For critical applications, verify with point-by-point software',
          'Suitable for: offices, retail, warehouses, classrooms, corridors',
        ],
      },
    ],
    faq: [
      { q: 'What calculation method does Lumina use?', a: 'The IES Lumen Method (zonal cavity method). It calculates average maintained illuminance from fixture lumens, room geometry, and surface reflectances. It is the same method used in EN 12464-1 design guides.' },
      { q: 'Does it support EN 12464-1?', a: 'Yes. Default target lux levels follow EN 12464-1 by room type. You can also set custom target lux per room for project-specific requirements.' },
      { q: 'How accurate is it?', a: 'For average illuminance, the lumen method is accurate to ±2–5% compared to photometric simulation, assuming correct room dimensions and reflectance values. It is not a substitute for point-by-point simulation in critical applications.' },
      { q: 'Can I use my own fixture lumens?', a: 'Yes. Every fixture has an editable lumen value. You can override the library default with manufacturer data from the fixture datasheet.' },
    ],
    relatedFeatures: [
      { label: 'Heat Map Visualisation', path: '/features/heat-map' },
      { label: 'DALI 2.0 Planning', path: '/features/dali-planning' },
      { label: 'PDF & Excel Export', path: '/features/pdf-excel-export' },
    ],
  },

  'dali-planning': {
    slug:      'dali-planning',
    tag:       'DALI 2.0',
    title:     'DALI 2.0 Circuit Planning Software',
    subtitle:  'Assign addresses, validate bus capacity, define zone groups, and export a driver schedule — all inside the same tool you designed the layout in.',
    seoTitle:  'DALI 2.0 Planning Software Online — Address Assignment & Driver Schedules | Lumina Design',
    seoDesc:   'Plan DALI 2.0 lighting circuits online. Auto-assign addresses, validate 64-device bus limits, define zone groups, and export driver schedules to PDF and Excel. Free trial.',
    canonical: 'https://app.lightillumina.com/features/dali-planning',
    stat:      '64',
    statLabel: 'Max devices per bus',
    sections: [
      {
        heading: 'What DALI 2.0 planning includes',
        body: 'DALI (Digital Addressable Lighting Interface, IEC 62386) allows individual control of every luminaire on a two-wire bus. Lumina handles the addressing and documentation side — the part that takes hours in a spreadsheet.',
        bullets: [
          'Per-fixture DALI address assignment (addresses 0–63)',
          'Bus capacity validation — warns when you exceed 64 devices',
          'Zone group editor — assign fixtures to scenes and groups',
          'Driver schedule export: address, channel, zone, wattage, driver model',
        ],
      },
      {
        heading: 'Auto-address assignment',
        body: 'One click assigns DALI addresses to all fixtures in the room, ordered by placement position. You can reassign individual addresses by clicking any fixture and editing the address field. The bus load indicator updates in real time.',
        bullets: [
          'Sequential auto-address from 0 in placement order',
          'Manual override on any individual fixture',
          'Duplicate address detection with visual warning',
          'Multi-bus support: split rooms across two buses when >64 devices',
        ],
      },
      {
        heading: 'Zone groups and scenes',
        body: 'Group fixtures into DALI zones for scene control. Common groupings: perimeter vs task lighting, daylight-linked zones near windows, emergency vs standard circuits. Zone data exports directly to the driver schedule.',
        bullets: [
          'Up to 16 groups per bus (DALI standard)',
          'Named zones (e.g. "Zone A — Perimeter", "Zone B — Task")',
          'Scene presets: 100%, 75%, 50%, 25%, off',
          'Zone assignments visible on canvas as colour overlays',
        ],
      },
      {
        heading: 'Driver schedule export',
        body: 'The driver schedule is the document your electrical contractor and commissioning engineer need. Lumina generates it in both PDF and Excel format, formatted for direct use on site.',
        bullets: [
          'One row per DALI device: address, zone, wattage, driver model',
          'Bus load summary: total devices, total wattage, bus utilisation %',
          'PDF formatted for A4 print, Excel for contractor editing',
          'Included automatically in the full PDF report',
        ],
      },
    ],
    faq: [
      { q: 'What is DALI 2.0?', a: 'DALI 2.0 (IEC 62386 Part 207/209) is the current version of the Digital Addressable Lighting Interface standard. It adds device discovery, query commands, and input device support (sensors, switches) to the original DALI protocol.' },
      { q: 'How many devices per DALI bus?', a: 'The DALI standard allows up to 64 individually addressable devices per bus. Lumina validates this limit and alerts you when a room exceeds it, prompting you to split across two buses.' },
      { q: 'Does Lumina generate commissioning documents?', a: 'Yes. The driver schedule export contains everything a commissioning engineer needs: device address, zone group, wattage, and driver model. It exports as both PDF and Excel.' },
      { q: 'Can I plan multiple DALI buses?', a: 'Yes. For rooms or floors with more than 64 devices, you can split the layout across multiple buses. Each bus is shown separately in the driver schedule.' },
    ],
    relatedFeatures: [
      { label: 'Lux Calculation', path: '/features/lux-calculation' },
      { label: 'PDF & Excel Export', path: '/features/pdf-excel-export' },
      { label: 'Floor Plan Upload', path: '/features/floor-plan-upload' },
    ],
  },

  'heat-map': {
    slug:      'heat-map',
    tag:       'HEAT MAP',
    title:     'Lighting Heat Map Visualisation',
    subtitle:  'See exactly where your light falls. A 6-colour gradient overlaid on your floor plan at 0.5m grid resolution — updated in real time as you place fixtures.',
    seoTitle:  'Lighting Heat Map Software — Real-Time Lux Visualisation | Lumina Design',
    seoDesc:   'Visualise light distribution with real-time heat maps at 0.5m grid resolution. Identify dark spots and overlapping zones instantly. Free 14-day trial.',
    canonical: 'https://app.lightillumina.com/features/heat-map',
    stat:      '0.5m',
    statLabel: 'Grid resolution',
    sections: [
      {
        heading: 'How the heat map works',
        body: 'The heat map renders a colour-coded lux grid over your room floor plan. Each 0.5m × 0.5m cell receives an estimated lux value based on the nadir illuminance of every fixture above it, using an inverse-square distance model with beam angle cut-off.',
        bullets: [
          '0.5m × 0.5m calculation grid across the full room',
          'Inverse-square model: lux = (I × cos θ) / d² per fixture',
          'Beam angle cut-off — only fixtures within beam cone contribute',
          'Superimposed on floor plan image if uploaded',
        ],
      },
      {
        heading: 'Colour scale',
        body: 'The 6-stop gradient maps lux values to colour intuitively — cool blues for low lux, warm reds for high lux. The scale adjusts dynamically to the range in your room, so you always see contrast regardless of absolute lux levels.',
        bullets: [
          'Blue → cyan → green → yellow → orange → red',
          'Dynamic scale: min and max set by your room\'s actual range',
          'Opacity overlay — floor plan remains visible beneath',
          'Toggle heat map on/off without losing fixture positions',
        ],
      },
      {
        heading: 'What to look for',
        body: 'Use the heat map to identify dark patches between fixtures, hotspots under downlights, and uneven distribution in large spaces. The goal is a relatively uniform yellow-green across task areas, with acceptable fall-off at room edges.',
        bullets: [
          'Dark blue patches: increase fixture count or reposition',
          'Red hotspots under single downlights: spread fixtures wider',
          'Streaky pattern: fixtures too far apart or beam angle too narrow',
          'Uniformity check: ratio of minimum to average lux (target >0.6)',
        ],
      },
    ],
    faq: [
      { q: 'How accurate is the heat map?', a: 'The heat map uses a simplified inverse-square model and is intended for qualitative distribution assessment, not precise photometric simulation. It reliably shows relative distribution, dark patches, and hotspots. For critical photometric accuracy, verify with IES-file-based simulation software.' },
      { q: 'Does it work on uploaded floor plans?', a: 'Yes. Upload a PNG, JPG, or PDF floor plan and the heat map overlays directly on top at the correct scale. You set the room dimensions and the grid aligns automatically.' },
      { q: 'Can I export the heat map?', a: 'The heat map is included in the PNG canvas export and in the PDF report\'s canvas snapshot section.' },
    ],
    relatedFeatures: [
      { label: 'Lux Calculation', path: '/features/lux-calculation' },
      { label: 'Floor Plan Upload', path: '/features/floor-plan-upload' },
      { label: 'PDF & Excel Export', path: '/features/pdf-excel-export' },
    ],
  },

  'floor-plan-upload': {
    slug:      'floor-plan-upload',
    tag:       'FLOOR PLANS',
    title:     'Upload Floor Plans and Design on Top',
    subtitle:  'Upload any floor plan — PNG, JPG, or PDF. Set real-world dimensions. Draw room boundaries and start placing fixtures in minutes.',
    seoTitle:  'Floor Plan Lighting Design Tool — Upload & Design Online | Lumina Design',
    seoDesc:   'Upload your floor plan (PNG, JPG, or PDF) and design lighting directly on top. Set real dimensions, draw rooms, place fixtures, and calculate lux — all in the browser.',
    canonical: 'https://app.lightillumina.com/features/floor-plan-upload',
    stat:      'PNG · JPG · PDF',
    statLabel: 'Supported formats',
    sections: [
      {
        heading: 'Upload any floor plan format',
        body: 'Paste or drag a floor plan image from AutoCAD, Revit, or any PDF source. Lumina renders it as the background layer of the canvas. Supported formats are PNG, JPG, and single-page PDF.',
        bullets: [
          'PNG and JPG: drag and drop directly onto the canvas',
          'PDF: first page rendered at 150 DPI, suitable for A1/A0 drawings',
          'AutoCAD DXF export → PNG workflow supported',
          'Floor plan stays locked as background — does not interfere with fixtures',
        ],
      },
      {
        heading: 'Set real-world scale',
        body: 'After uploading, you set the room\'s real dimensions in metres (or feet). Lumina calibrates the canvas grid to match, so every fixture placement and lux calculation uses accurate distances. Supported units: metres, centimetres, feet.',
        bullets: [
          'Set width and length in m, cm, or ft',
          'Grid snap aligns to 0.25m intervals by default',
          'Zoom in and out while maintaining calibrated scale',
          'Dimension labels shown on room boundary',
        ],
      },
      {
        heading: 'Draw room boundaries',
        body: 'Use the room boundary tool to trace the outline of each room or zone on the floor plan. Boundaries define the calculation area for lux and the heat map grid. Multiple rooms per project are supported.',
        bullets: [
          'Click-to-draw polygon room boundary',
          'Reshape by dragging corner points',
          'Multiple rooms per floor plan',
          'Each room has its own lux target and compliance status',
        ],
      },
      {
        heading: 'Multi-floor projects',
        body: 'Professional plan users can create multi-floor projects. Each floor has its own canvas, floor plan, and fixture layout. The PDF report aggregates all floors into a single document.',
        bullets: [
          'Unlimited floors on Professional plan',
          '5 rooms per floor on Pro plan',
          'Floor tabs in the project sidebar',
          'PDF report covers all floors in one document',
        ],
      },
    ],
    faq: [
      { q: 'What floor plan formats does Lumina accept?', a: 'PNG, JPG, and single-page PDF. For multi-page PDFs, only the first page is imported. For CAD drawings, export as PNG at 150 DPI or higher for best clarity.' },
      { q: 'Can I design without uploading a floor plan?', a: 'Yes. You can work on a blank canvas with a configurable grid. Set the room dimensions manually and draw boundaries without a background image.' },
      { q: 'What is the maximum file size?', a: 'Floor plan images up to 10MB are supported. For large PDF drawings, compress the PDF first or export a PNG at 150 DPI.' },
    ],
    relatedFeatures: [
      { label: 'Heat Map Visualisation', path: '/features/heat-map' },
      { label: 'Lux Calculation', path: '/features/lux-calculation' },
      { label: 'PDF & Excel Export', path: '/features/pdf-excel-export' },
    ],
  },

  'pdf-excel-export': {
    slug:      'pdf-excel-export',
    tag:       'EXPORTS',
    title:     'Professional PDF Reports & Excel BOQ',
    subtitle:  'One click generates a client-ready 8-page PDF report and a BOQ spreadsheet. Formatted for A4 print and ready for handover.',
    seoTitle:  'Lighting Design PDF Report & Excel BOQ Export | Lumina Design',
    seoDesc:   'Export professional lighting design reports to PDF (8 pages, A4) and Excel BOQ. Includes fixture schedule, DALI driver table, lux summary, and canvas snapshot.',
    canonical: 'https://app.lightillumina.com/features/pdf-excel-export',
    stat:      '8',
    statLabel: 'Pages per PDF report',
    sections: [
      {
        heading: 'What the PDF report contains',
        body: 'The PDF report is structured for professional project handover. It covers everything from project overview to fixture schedule to DALI commissioning data — in a consistent A4 layout your clients and contractors will recognise.',
        bullets: [
          'Page 1: Project summary — name, date, designer, client',
          'Page 2: Canvas snapshot with room layout and fixture positions',
          'Page 3: Lux summary — average lux, target, compliance status per room',
          'Page 4–5: Fixture schedule — type, quantity, wattage, lumens',
          'Page 6: Circuit allocation table (800W max per circuit)',
          'Page 7–8: DALI driver schedule (Pro / Professional plans)',
        ],
      },
      {
        heading: 'Excel BOQ (Bill of Quantities)',
        body: 'The Excel export is formatted for procurement and site use. It lists every fixture with quantity, wattage, driver type, and DALI address. The BOQ can be sent directly to a supplier or pasted into a project cost schedule.',
        bullets: [
          'One row per fixture type with total quantities',
          'Wattage, lumens, beam angle, driver type columns',
          'DALI address and zone group columns (Pro / Professional)',
          'Summary row: total wattage, total fixtures, circuit count',
        ],
      },
      {
        heading: 'Branded reports (Professional plan)',
        body: 'On the Professional plan, PDF reports include your company name, logo, and project reference in the header and footer. Branded reports remove the Lumina Design watermark and are suitable for direct client delivery.',
        bullets: [
          'Company name and logo in header',
          'Project reference and revision number',
          'No Lumina watermark',
          'Custom footer text',
        ],
      },
    ],
    faq: [
      { q: 'Which plans include PDF export?', a: 'All plans including Free include PDF export. Excel BOQ export is available on Pro and Professional plans. Branded reports (no watermark, custom logo) are a Professional plan feature.' },
      { q: 'Can I customise the PDF layout?', a: 'The layout is fixed for consistency. On the Professional plan you can add your company name, logo, and project reference to the header/footer.' },
      { q: 'What format is the Excel export?', a: '.xlsx format compatible with Microsoft Excel, Google Sheets, and LibreOffice Calc.' },
    ],
    relatedFeatures: [
      { label: 'Lux Calculation', path: '/features/lux-calculation' },
      { label: 'DALI 2.0 Planning', path: '/features/dali-planning' },
      { label: 'Floor Plan Upload', path: '/features/floor-plan-upload' },
    ],
  },
}
