export const BLOG_POSTS = {
  'how-to-calculate-lux-for-office-lighting': {
    slug:      'how-to-calculate-lux-for-office-lighting',
    title:     'How to Calculate Lux for Office Lighting (with Formula + Free Calculator)',
    excerpt:   'Step-by-step guide to calculating average maintained illuminance using the IES Lumen Method (zonal cavity). Includes the formula, worked example, and a free online calculator.',
    date:      '2026-05-15',
    readTime:  '8 min read',
    category:  'Lighting Design',
    seoTitle:  'How to Calculate Lux for Office Lighting — Formula + Free Calculator | Lumina Design',
    seoDesc:   'Learn how to calculate lux levels for office lighting using the IES Lumen Method (zonal cavity). Step-by-step formula, worked example, UF tables, and a free online lux calculator.',
    canonical: 'https://app.lightillumina.com/blog/how-to-calculate-lux-for-office-lighting',
    sections: [
      {
        heading: 'What is lux, and why does it matter?',
        body: `Lux (lx) is the SI unit of illuminance — it measures how much light falls on a surface. One lux equals one lumen per square metre. In office lighting design, achieving the correct lux level is both a legal requirement (EN 12464-1, NBC India 2016) and a direct driver of occupant comfort and productivity.

The target for a general office work area is **500 lux** maintained average illuminance at the working plane (typically 0.75 m above floor). For computer-intensive tasks and drawing offices, the same 500 lux applies; for meeting rooms, 300–500 lux is acceptable.`,
      },
      {
        heading: 'The IES Lumen Method (zonal cavity method) explained',
        body: `The most widely used method for calculating average maintained illuminance in a room is the **IES Lumen Method**, also called the zonal cavity method. It calculates the *average* lux level across the entire working plane rather than point-by-point values.

The method is standardised in IESNA RP-1 and is accepted for the vast majority of commercial lighting design work — offices, classrooms, warehouses, retail, and hospitals. Point-by-point simulation (DIALux, AGi32) is only required when precise spatial distribution matters, such as in operating theatres or precision manufacturing.

The formula has three steps:
1. Calculate the Room Cavity Ratio (RCR)
2. Look up the Utilisation Factor (UF)
3. Calculate average maintained illuminance (Ēm)`,
      },
      {
        heading: 'Step 1 — Room Cavity Ratio (RCR)',
        body: `The RCR describes the proportions of the room cavity (the volume between the luminaire plane and the working plane):

**RCR = 5 × h × (L + W) / (L × W)**

Where:
- **h** = cavity height = ceiling height − working plane height (typically ceiling height − 0.75 m)
- **L** = room length (m)
- **W** = room width (m)

**Example:** 10 m × 8 m office, 2.8 m ceiling, 0.75 m working plane.

h = 2.8 − 0.75 = 2.05 m

RCR = 5 × 2.05 × (10 + 8) / (10 × 8) = 5 × 2.05 × 18 / 80 = **2.31**

A higher RCR means a "narrower" room relative to its height — light has more wall to hit before reaching the work plane, so UF is lower.`,
      },
      {
        heading: 'Step 2 — Utilisation Factor (UF)',
        body: `The Utilisation Factor is a dimensionless coefficient (0 to 1) that represents the fraction of total lamp lumens that actually reaches the working plane. It depends on:
- The RCR (from Step 1)
- Room surface reflectances (ceiling, wall, floor)
- The luminaire's light distribution (obtained from the manufacturer's photometric data)

For a standard office recessed LED panel (typical UF table, medium reflectances — ceiling 70%, wall 50%, floor 20%):

| RCR | UF   |
|-----|------|
| 1   | 0.67 |
| 2   | 0.61 |
| 3   | 0.55 |
| 4   | 0.50 |
| 5   | 0.45 |

For RCR = 2.31, interpolate: UF ≈ 0.61 − (0.31 × (0.61 − 0.55)) = **0.59**

If you don't have the manufacturer's UF table, use the Lumina Design free lux calculator — it uses a built-in UF lookup derived from CIBSE LG1 recommendations.`,
      },
      {
        heading: 'Step 3 — Average maintained illuminance (Ēm)',
        body: `**Ēm = (N × Φ × UF × MF) / A**

Where:
- **N** = number of luminaires
- **Φ** = lumens per luminaire (from the datasheet — use *luminaire* lumens, not lamp lumens)
- **UF** = Utilisation Factor (from Step 2)
- **MF** = Maintenance Factor (typically 0.80 for a clean indoor installation per CIBSE TM12)
- **A** = room area = L × W (m²)

**Continuing the example:** 20 LED panels, each 4,000 lm, UF = 0.59, MF = 0.80, area = 80 m²

Ēm = (20 × 4,000 × 0.59 × 0.80) / 80 = **472 lux**

This is just below the 500 lux EN 12464-1 target. Options: add one more luminaire (giving ~496 lux), use higher-output fixtures (4,250 lm gives ~502 lux), or check whether the MF can be improved with a better maintenance regime.`,
      },
      {
        heading: 'Working in reverse — how many fixtures do I need?',
        body: `Rearrange the formula to solve for N:

**N = (Ēm × A) / (Φ × UF × MF)**

For the same room targeting 500 lux: N = (500 × 80) / (4,000 × 0.59 × 0.80) = 40,000 / 1,888 = **21.2 → 22 luminaires**

This is the planning calculation. You then check whether 22 luminaires can be arranged in an aesthetically and photometrically satisfactory grid (4 rows × 5 or 6 columns, for example) before doing a final verification calculation.`,
      },
      {
        heading: 'Maintenance Factor (MF) — what value should you use?',
        body: `The Maintenance Factor accounts for the reduction in output over time due to:
- **Lamp lumen depreciation (LLD):** LEDs lose output over time (typically 3–5% over 50,000 hours)
- **Luminaire dirt depreciation (LDD):** Dust on the fitting reduces output
- **Room surface depreciation (RSDD):** Dirty walls and ceilings reflect less light

CIBSE TM12 provides a method for calculating MF precisely, but the standard default values are:
- **0.80** — clean indoor environment (office, classroom, retail) — *use this for most projects*
- **0.70** — moderate pollution (workshop, restaurant kitchen)
- **0.65** — heavy pollution (factory, car park)

Lumina Design uses 0.80 as the default and allows you to select 0.70 or 0.65 for non-standard environments.`,
      },
      {
        heading: 'Common mistakes to avoid',
        body: `**1. Using lamp lumens instead of luminaire lumens.** A 4,000 lm LED module inside a fitting with 85% efficiency produces only 3,400 lm at the luminaire aperture. Always use the *luminaire* lumen output from the photometric datasheet.

**2. Wrong cavity height.** The cavity height h is from the luminaire plane to the work plane, not from ceiling to floor. If fixtures are recessed into a 2.8 m ceiling and the work plane is 0.75 m, h = 2.05 m — not 2.8 m.

**3. Ignoring room reflectances.** A room with dark walls and a dark ceiling can have a UF 20–30% lower than a white room of the same dimensions. Always check your reflectance assumptions against the actual finishes specified.

**4. Using maintained illuminance as the design value without MF.** The calculated Ēm *already includes* the MF — it represents the illuminance at the *end* of the maintenance cycle, not at installation. At installation ("initial" illuminance), actual levels will be higher (Ēm / MF = ~25% higher than the maintained value).`,
      },
      {
        heading: 'Use the free Lumina lux calculator',
        body: `If you want to skip the manual calculation, the Lumina Design free lux calculator does all of this automatically. Enter your room dimensions, fixture count and lumens, and it computes RCR, interpolates the UF table, and gives you the maintained lux with a pass/fail against EN 12464-1 and NBC India targets.

The calculator is free — no account required. It also works backwards (target lux → number of fixtures needed) and lets you save the result to a full project with heat map and PDF report if you upgrade to a paid plan.`,
      },
    ],
    faq: [
      {
        q: 'What is the minimum lux level for an office?',
        a: 'EN 12464-1 specifies 500 lux maintained average illuminance at the working plane for general office tasks. NBC India 2016 specifies the same 500 lux for offices. For computer-intensive offices and drawing offices, the same 500 lux target applies. Corridors and circulation areas require 100 lux.',
      },
      {
        q: 'What is a good UF value for office lighting?',
        a: 'For a typical office room (RCR 1–3) with standard white finishes (ceiling 70%, walls 50%, floor 20%) and a modern LED recessed panel, UF values typically range from 0.55 to 0.67. Higher UF means more efficient use of light; values below 0.45 usually indicate a very deep room cavity or dark surfaces.',
      },
      {
        q: 'Is the lumen method accurate enough for compliance?',
        a: 'For most commercial projects — offices, classrooms, retail, warehouses — yes. EN 12464-1 specifies maintained average illuminance, which is exactly what the lumen method calculates. Point-by-point simulation is only required when spatial uniformity or per-point compliance is specified (e.g., operating theatres, sports halls with demanding uniformity ratios).',
      },
      {
        q: 'How do I convert lumens to lux?',
        a: 'Lux = lumens / area (m²). This is the simplified formula assuming uniform distribution and perfect utilisation — it\'s the starting point before applying UF and MF corrections. For a 4,000 lm fixture in a 10 m² area: 4,000 / 10 = 400 lux (initial, without losses). The full lumen method calculation gives a more accurate result.',
      },
    ],
    relatedLinks: [
      { label: 'Free Lux Calculator', href: '/tools/lux-calculator' },
      { label: 'Office Lighting Design Guide', href: '/solutions/offices' },
      { label: 'EN 12464-1 Lux Requirements Table', href: '/blog/en-12464-1-lux-requirements-complete-table' },
      { label: 'Lux Calculation Feature', href: '/features/lux-calculation' },
    ],
  },

  'en-12464-1-lux-requirements-complete-table': {
    slug:      'en-12464-1-lux-requirements-complete-table',
    title:     'EN 12464-1 Lux Requirements: Complete Table for All Room Types (2021)',
    excerpt:   'Full reference table of maintained illuminance (Ēm) requirements from EN 12464-1:2021 — covering offices, classrooms, hospitals, warehouses, retail, and more.',
    date:      '2026-05-15',
    readTime:  '6 min read',
    category:  'Standards & Compliance',
    seoTitle:  'EN 12464-1 Lux Requirements — Complete Table for All Room Types | Lumina Design',
    seoDesc:   'Full EN 12464-1:2021 lux requirements table for offices, classrooms, hospitals, warehouses, retail and more. Includes Ēm, UGR, Ra values and NBC India equivalents.',
    canonical: 'https://app.lightillumina.com/blog/en-12464-1-lux-requirements-complete-table',
    sections: [
      {
        heading: 'About EN 12464-1',
        body: `EN 12464-1 is the European standard for lighting of indoor workplaces, published by the European Committee for Standardisation (CEN) and most recently revised in 2021. It specifies minimum requirements for:

- **Ēm** — Maintained average illuminance (lux) at the reference plane
- **UGRL** — Unified Glare Rating limit (discomfort glare)
- **Ra** — Minimum colour rendering index

The standard is adopted in the UK (BS EN 12464-1), Germany (DIN EN 12464-1), and most EU member states. It is widely used as a reference in India alongside NBC India 2016.

Note: EN 12464-1 specifies *maintained* illuminance — the average level expected at the end of the maintenance cycle (after lamp depreciation and dirt accumulation). Initial illuminance at installation will be approximately 25% higher.`,
      },
      {
        heading: 'Offices and administrative areas',
        body: `| Task / Area | Ēm (lux) | UGRL | Ra |
|---|---|---|---|
| Filing, copying, circulation | 300 | 19 | 80 |
| Writing, typing, reading, data processing | 500 | 19 | 80 |
| Technical drawing | 750 | 16 | 80 |
| CAD workstation | 500 | 19 | 80 |
| Conference and meeting rooms | 500 | 19 | 80 |
| Reception desk | 300 | 22 | 80 |
| Archive | 200 | 25 | 80 |

The 500 lux standard for general office work is the most widely cited figure in commercial lighting design. Meeting rooms are commonly designed at 300–500 lux with dimmable lighting to allow presentations.`,
      },
      {
        heading: 'Educational facilities',
        body: `| Task / Area | Ēm (lux) | UGRL | Ra |
|---|---|---|---|
| Classroom (general) | 300 | 19 | 80 |
| Classroom (reading/writing intensive) | 500 | 19 | 80 |
| Blackboard / whiteboard area | 500 | 19 | 80 |
| Lecture theatre (tiered) | 500 | 19 | 80 |
| Art room | 500 | 19 | 90 |
| Craft room / workshop | 500 | 19 | 80 |
| Library (reading area) | 500 | 19 | 80 |
| Library (stacks/shelving) | 200 | 19 | 80 |
| Gymnasium | 300 | 22 | 80 |
| Corridor | 100 | 28 | 80 |

Note the higher Ra ≥ 90 requirement for art rooms — colour accuracy matters for work involving colour matching. This typically requires LEDs with high CRI.`,
      },
      {
        heading: 'Healthcare facilities',
        body: `| Task / Area | Ēm (lux) | UGRL | Ra |
|---|---|---|---|
| Patient ward (general) | 100 | 19 | 80 |
| Patient ward (reading/examination) | 300 | 19 | 80 |
| Examination room | 500 | 19 | 90 |
| Operating theatre (general) | 1,000 | 19 | 90 |
| Operating theatre (operating table) | 10,000–100,000 | — | 90 |
| Recovery room | 300 | 19 | 90 |
| Nurse station | 500 | 19 | 80 |
| Corridor (day) | 200 | 22 | 80 |
| Corridor (night) | 50 | — | 80 |
| Laboratory | 500 | 19 | 80 |
| Pharmacy | 500 | 19 | 90 |

Operating table luminaires are specialist surgical lighting systems that fall outside standard building illumination design. The 10,000–100,000 lux figure refers to the surgical field illuminance from the operating light itself.`,
      },
      {
        heading: 'Industrial and warehouse facilities',
        body: `| Task / Area | Ēm (lux) | UGRL | Ra |
|---|---|---|---|
| Storage / goods-in (bulk) | 100 | 28 | 40 |
| Storage / goods-in (selective picking) | 200 | 25 | 60 |
| Packing and dispatch | 300 | 25 | 60 |
| Assembly (rough) | 200 | 25 | 60 |
| Assembly (medium detail) | 300 | 25 | 60 |
| Assembly (fine detail) | 500 | 22 | 80 |
| Assembly (very fine / precision) | 750 | 22 | 80 |
| Quality control (general) | 500 | 22 | 80 |
| Quality control (high accuracy) | 1,000 | 19 | 90 |
| Loading bays | 150 | 25 | 40 |

Warehouse aisle lighting is typically designed to 200 lux at the floor plane. For high-bay applications (>8 m mounting height), LED high-bay fittings with appropriate beam angles are required to achieve sufficient vertical illuminance on racking faces.`,
      },
      {
        heading: 'Retail and commercial spaces',
        body: `| Task / Area | Ēm (lux) | UGRL | Ra |
|---|---|---|---|
| Sales floor (general merchandise) | 300 | 22 | 80 |
| Sales floor (fine goods, fashion) | 500 | 22 | 80 |
| Checkout / counter | 500 | 19 | 80 |
| Display window (daytime) | 1,500 | — | 80 |
| Fitting room | 300 | 22 | 90 |
| Mall / shopping centre concourse | 200 | 22 | 80 |

Retail lighting is often designed significantly above EN 12464-1 minimums for competitive reasons — premium retailers frequently specify 750–1,000 lux on key merchandise areas and use accent lighting (track spotlights at 3–5× the ambient level) to create visual hierarchy.`,
      },
      {
        heading: 'Common areas and circulation',
        body: `| Task / Area | Ēm (lux) | UGRL | Ra |
|---|---|---|---|
| Entrance lobby / reception | 300 | 22 | 80 |
| Lift lobby | 100 | 25 | 80 |
| Corridor / hallway | 100 | 28 | 40 |
| Staircase | 150 | 25 | 40 |
| Car park (interior) | 75 | 25 | 40 |
| Car park (entrance transition) | 300 | — | 40 |
| Toilet / washroom | 200 | 25 | 80 |
| Canteen / cafeteria | 200 | 22 | 80 |
| Kitchen / catering | 500 | 22 | 80 |
| Server room | 500 | 19 | 80 |

Emergency lighting requirements (minimum 1 lux on escape routes) are governed separately by EN 1838, not EN 12464-1.`,
      },
      {
        heading: 'NBC India 2016 equivalents',
        body: `NBC India 2016 (National Building Code) Part 8 Section 1 specifies lighting requirements for Indian buildings. The values closely mirror EN 12464-1 for most commercial spaces:

| Space | NBC India (lux) | EN 12464-1 (lux) |
|---|---|---|
| General office | 500 | 500 |
| Conference room | 300 | 500 |
| Reception | 300 | 300 |
| Classroom | 300 | 300–500 |
| Hospital ward | 100–300 | 100–300 |
| Retail (general) | 500 | 300–500 |
| Warehouse (bulk) | 100 | 100 |
| Corridor | 100 | 100 |

Where NBC India and EN 12464-1 differ, NBC India 2016 values should be used for projects in India. Lumina Design applies NBC India targets by default for projects designated as India-based.`,
      },
      {
        heading: 'How to use these values in Lumina Design',
        body: `When you select a room type in Lumina Design, the target lux is automatically set from the EN 12464-1 / NBC India table. The calculator then shows whether your fixture layout achieves the maintained illuminance target.

Lumina checks:
- **GOOD** (≥ target): Layout meets the standard
- **UNDERLIT** (< target): Increase fixture count or lumen output
- **OVERLIT** (> 1.5× target): Consider reducing output or switching to a dimmed installation

You can also set a custom lux target for spaces not covered by the standard, or for design briefs that specify a different level.`,
      },
    ],
    faq: [
      {
        q: 'Is EN 12464-1 mandatory in the UK?',
        a: 'EN 12464-1 is not directly cited in UK building regulations, but it is referenced in CIBSE SLL Code for Lighting and is widely accepted as demonstrating compliance with the Workplace (Health, Safety and Welfare) Regulations 1992, which require "suitable and sufficient" lighting. In practice, designing to EN 12464-1 is considered best practice and will satisfy most regulatory requirements.',
      },
      {
        q: 'What is the difference between maintained and initial illuminance?',
        a: 'Initial illuminance is the level immediately after installation with new lamps/LEDs. Maintained illuminance (Ēm) is the level at the end of the maintenance cycle, after light output has degraded. EN 12464-1 specifies maintained values. To get initial illuminance, divide Ēm by the Maintenance Factor (typically 0.80), giving approximately 25% higher values at installation.',
      },
      {
        q: 'What does UGRL mean?',
        a: 'UGR (Unified Glare Rating) is a measure of discomfort glare from luminaires. UGRL is the limit value — the maximum UGR that is acceptable for the space. A lower UGRL means tighter control of glare. EN 12464-1 specifies UGRL limits of 16 (technical drawing), 19 (offices, classrooms), 22 (retail), 25 (corridors), and 28 (heavy storage). UGR depends on luminaire photometry, room geometry, and luminance — it cannot be assessed with the lumen method alone.',
      },
      {
        q: 'What is Ra / CRI in lighting?',
        a: 'Ra is the general colour rendering index (CRI) — a measure of how accurately a light source renders colours compared to a reference source. Ra ranges from 0 to 100. Most commercial spaces require Ra ≥ 80. Spaces where colour accuracy is critical (art rooms, surgical suites, high-quality retail) require Ra ≥ 90. Modern LED products typically achieve Ra 80–95.',
      },
    ],
    relatedLinks: [
      { label: 'Free Lux Calculator', href: '/tools/lux-calculator' },
      { label: 'How to Calculate Lux for Offices', href: '/blog/how-to-calculate-lux-for-office-lighting' },
      { label: 'Office Lighting Guide', href: '/solutions/offices' },
      { label: 'Hospital Lighting Guide', href: '/solutions/hospitals' },
    ],
  },

  'dali-2-explained-addressing-bus-load-driver-scheduling': {
    slug:      'dali-2-explained-addressing-bus-load-driver-scheduling',
    title:     'DALI 2.0 Explained: Addressing, Bus Load, and Driver Scheduling',
    excerpt:   'A practical guide to DALI 2.0 for lighting designers — how addressing works, how to calculate bus load, what driver scheduling means, and how to plan a DALI installation without being an electrical engineer.',
    date:      '2026-05-15',
    readTime:  '10 min read',
    category:  'Controls & DALI',
    seoTitle:  'DALI 2.0 Explained: Addressing, Bus Load & Driver Scheduling | Lumina Design',
    seoDesc:   'DALI 2.0 guide for lighting designers: how DALI addressing works, how to calculate bus load capacity (250 mA / 2 mA per device), zone groups, scenes, and driver scheduling.',
    canonical: 'https://app.lightillumina.com/blog/dali-2-explained-addressing-bus-load-driver-scheduling',
    sections: [
      {
        heading: 'What is DALI, and why does it matter?',
        body: `DALI (Digital Addressable Lighting Interface) is a digital protocol for controlling lighting in commercial and industrial buildings. The current version — DALI-2 — is standardised in IEC 62386 and is the primary protocol for intelligent lighting control in offices, hospitals, educational buildings, and large retail environments in Europe and increasingly in India.

Unlike traditional 0–10V dimming (where all fixtures in a circuit dim together), DALI allows:
- **Individual addressability**: each fixture has a unique address (0–63) and can be controlled independently
- **Bidirectional communication**: fixtures can report their status, lamp failure, and actual output level back to the controller
- **Groups and scenes**: fixtures can be organised into logical groups and preset scenes without rewiring
- **Device-type awareness**: DALI-2 defines device types (LED drivers, sensors, relays, emergency) — a controller can query and configure each type specifically

For a lighting designer, this means you can deliver a system where the client can adjust zones, scenes, and schedules through a wall panel or mobile app without an electrician. It also means a single DALI bus can carry both control and monitoring signals for an entire floor.`,
      },
      {
        heading: 'How DALI addressing works',
        body: `Each DALI bus can address up to **64 individual devices** (addresses 0–63). Each device also belongs to up to **16 groups** (groups 0–15). Scenes (preset lighting states) are stored on the individual devices — up to **16 scenes** per device.

**Addressing process:**

1. **Commissioning tool** (or the Lumina DALI planner) issues a broadcast "program short address" command over the bus
2. Each device that has been assigned a short address (0–63) saves it in non-volatile memory
3. The controller can then send commands to individual addresses, group addresses, or broadcast

**Physical vs. logical addressing:**
- Physical addressing: which fixture is at address 12 (determined during commissioning)
- Logical addressing: what zone/group address 12 belongs to (can be reprogrammed without rewiring)

For planning purposes, you assign an expected address to each fixture position on the floor plan. The electrician then assigns actual addresses during commissioning. Lumina Design outputs a DALI address schedule (PDF/Excel) that maps each fixture position to its planned address and group memberships.`,
      },
      {
        heading: 'Bus load calculation — the 250 mA rule',
        body: `The most common DALI commissioning error is overloading the bus. The DALI standard specifies:

- **Maximum bus current**: 250 mA total per DALI bus segment
- **Each control device (driver, sensor, etc.)**: draws approximately 2 mA from the bus
- **Maximum devices on one bus**: 250 / 2 = **125 milliamp budget** — but the address space limits you to 64 control gear (gear = LED drivers) + 64 control devices (sensors, pushbuttons), totalling 64 + 64 = **128 devices maximum per bus**

In practice:
- 64 LED drivers at 2 mA each = 128 mA
- 10 DALI sensors at 2 mA each = 20 mA
- 4 DALI pushbutton controllers at 2 mA each = 8 mA
- Total = 156 mA — within the 250 mA limit ✓

**Rule of thumb:** For a bus with LED drivers only, you can safely put **up to 64 drivers** on one bus. Adding sensors and pushbuttons reduces the available driver count, but in practice you rarely hit the current limit before hitting the 64-address limit.

**Multiple buses:** For a floor with 128 fixtures, you need at least 2 DALI buses. Each bus needs its own DALI master/controller (or a multi-bus controller). Lumina Design's bus load validator shows the milliamp draw for your planned device count and warns when you are near the limits.`,
      },
      {
        heading: 'Groups and zones — the design tool for lighting control',
        body: `Groups are the primary tool for organising DALI control:
- A **group** can contain any subset of the 64 devices on a bus
- Each device can belong to **up to 16 groups simultaneously**
- A command sent to group 3 (for example) dims all devices in group 3 simultaneously

**Typical zone strategy for an open-plan office:**
- Group 0: All lights (broadcast control)
- Groups 1–4: Perimeter zones (window-adjacent rows for daylight harvesting)
- Groups 5–8: Interior zones
- Group 9: Meeting room A
- Group 10: Meeting room B
- Group 15: Emergency (DALI emergency control gear only)

Groups are stored on the devices and can be reassigned in commissioning software without rewiring. This is why DALI is preferred over switched circuits — if the client later reorganises the floor plan, zones can be remapped in software.

In Lumina Design, you draw zone boundaries on the floor plan and the system automatically assigns fixtures to groups based on their location.`,
      },
      {
        heading: 'Scenes — programming preset lighting states',
        body: `Each DALI device stores up to **16 scenes** (numbered 0–15) in non-volatile memory. A scene stores the output level (0–100%) for that specific device when the scene is recalled.

Typical scenes for an office:
- Scene 0: Off (0%)
- Scene 1: Full presence (100%)
- Scene 2: Meeting/presentation (50% perimeter, 30% interior)
- Scene 3: Cleaning (100% all)
- Scene 4: Early morning/evening (30%)
- Scene 5: Daylight supplement (variable based on sensor)

Scene recall is instant — all devices respond simultaneously, making DALI scenes cleaner than sequentially-dimmed switch circuits. Scenes can be triggered from wall panels, BMS, occupancy sensors, or time schedules.

Lumina Design outputs a scene matrix (fixture × scene number → dim level %) as part of the DALI schedule export. This is given to the commissioning engineer to program into the DALI controller.`,
      },
      {
        heading: 'Driver scheduling — time-based control',
        body: `Most DALI controllers include a scheduler — a time-based automation system that sends scene recall or dim commands at programmed times. This is the basis of daylight-linked and presence-linked control strategies required by BREEAM, LEED, and the BEE Energy Conservation Building Code (ECBC) in India.

**Typical schedule for an office floor:**

| Time | Event | Action |
|---|---|---|
| 07:00 | Pre-occupation warm-up | Scene 4 (30%) all zones |
| 08:00 | Occupation start | Scene 1 (100%) presence zones |
| 08:00–18:00 | Daylight harvesting | Groups 1–4 auto-dim via photosensor |
| 13:00–14:00 | Lunch (if sensors detect absence) | Scene 4 after 10 min absence |
| 18:00 | End of core hours | Scene 4 all zones |
| 19:30 | Cleaning | Scene 3 (100%) for 90 min |
| 21:00 | All off (if no occupancy) | Scene 0 |

**Driver scheduling in Lumina Design:**
Lumina's Pro and Professional plans include a driver schedule builder. You define time blocks, assign scenes per zone group, and export a schedule table that the commissioning engineer imports into the DALI controller. The export format is compatible with standard DALI software tools.`,
      },
      {
        heading: 'DALI-2 vs DALI (first generation)',
        body: `DALI-2 (IEC 62386, Parts 200+) is not backward-compatible in all scenarios with the original DALI standard (IEC 60929). Key differences:

- **Device type standardisation**: DALI-2 formally defines device types (DT-0 to DT-8) including LED drivers, emergency lighting, colour tunable, and RGB fixtures. First-gen DALI only defined fluorescent and incandescent
- **Mandatory interoperability testing**: DALI-2 devices must be certified by the DALI Alliance, ensuring multi-vendor interoperability. First-gen DALI lacked this mandatory certification
- **Instance-based architecture**: DALI-2 separates control gear (drivers) from control devices (sensors, pushbuttons) — they share the same bus but are addressed independently
- **Backward compatibility**: First-gen DALI gear can still be addressed on a DALI-2 bus, but will not respond to DT-specific DALI-2 commands

For new installations, always specify DALI-2 certified products. Mixing DALI-2 and first-gen DALI is technically possible but complicates commissioning.`,
      },
      {
        heading: 'Common DALI design mistakes',
        body: `**1. Putting too many fixtures on one bus.** 64 addresses is the hard limit; budget for sensors and pushbuttons from the start. If a floor has 80 fixtures, plan two buses from the outset.

**2. Forgetting the DALI cable polarity.** DALI is polarity-insensitive — but many first-gen drivers are not. Check the driver datasheet. Using DALI-2 certified products eliminates this risk.

**3. Mixing DALI zones and mains switching zones.** If some fixtures are on a switched circuit (no DALI), they cannot participate in scenes or groups. Either convert to full DALI or document the non-DALI circuits clearly in the commissioning schedule.

**4. Not planning emergency lighting integration.** DALI emergency gear (DT-1) participates in the DALI bus for monitoring and testing, but must maintain independent battery backup independent of the DALI controller power supply. Plan the emergency loop separately and map emergency addresses in a dedicated schedule.

**5. Leaving group assignment to the electrician.** Group assignment should be in the lighting designer's DALI schedule. If you leave it to the commissioning engineer, you may get groups that don't match the control strategy.`,
      },
    ],
    faq: [
      {
        q: 'How many fixtures can I put on a DALI bus?',
        a: 'A single DALI bus can address up to 64 control gear (LED drivers) and 64 control devices (sensors, pushbuttons) simultaneously — 128 devices total, subject to a 250 mA bus current limit. In practice, 64 LED drivers at 2 mA each use 128 mA, leaving headroom for sensors. For more than 64 fixtures, use multiple DALI buses each with their own controller.',
      },
      {
        q: 'What cable do I need for DALI?',
        a: 'DALI runs on standard two-core cable. The IEC 62386 standard specifies a SELV (Safety Extra Low Voltage) 16V bus. Typical cable: 1.5 mm² two-core (DALI is not polarity-sensitive in DALI-2). Maximum bus length depends on cable resistance — typically 300 m with standard cable, though manufacturers often specify shorter runs. Run DALI cable separately from mains wiring.',
      },
      {
        q: 'Do I need a DALI controller for every bus?',
        a: 'Yes. Each DALI bus segment requires at least one DALI master/controller to issue commands and receive status. Some systems use a centralised multi-bus controller (one unit for 4–16 buses); others use distributed controllers (one per bus). The controller connects to the building BMS via Modbus, BACnet, or KNX.',
      },
      {
        q: 'Is DALI suitable for outdoor or emergency lighting?',
        a: 'DALI-2 includes emergency lighting device types (DT-1) with dedicated commands for function test, duration test, and inhibit mode — making it well-suited for DALI-addressed emergency fittings. Outdoor DALI is possible but requires DALI-rated cable and waterproofed enclosures for all bus equipment. The bus itself operates at SELV voltage (safe for outdoor use), but standard DALI cable is not rated for direct burial.',
      },
      {
        q: 'What does Lumina Design output for DALI planning?',
        a: 'Lumina Design Pro and Professional plans export a DALI schedule including: fixture-to-address mapping, group assignments, scene matrix (fixture × scene → dim level), bus load summary (mA per bus), and driver schedule table (time → scene events). The schedule is available as a formatted PDF and an Excel workbook.',
      },
    ],
    relatedLinks: [
      { label: 'DALI Planning Feature', href: '/features/dali-planning' },
      { label: 'Office Lighting Solutions', href: '/solutions/offices' },
      { label: 'PDF & Excel Export', href: '/features/pdf-excel-export' },
      { label: 'DIALux Alternative', href: '/compare/dialux-alternative' },
    ],
  },
}

export const BLOG_LIST = Object.values(BLOG_POSTS).sort((a, b) => new Date(b.date) - new Date(a.date))
