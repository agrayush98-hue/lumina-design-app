
# ============================================================
# LIGHTING & AUTOMATION DESIGN PLATFORM
# Full Project Architecture
# ============================================================

lighting-platform/
│
├── README.md
├── package.json                        # Root workspace config (pnpm workspaces)
├── pnpm-workspace.yaml
├── turbo.json                          # Turborepo pipeline config
│
# ================================================================
# CLOUDFLARE WORKERS — Pure Logic, No UI
# ================================================================
├── workers/
│   ├── wrangler.toml                   # CF Workers + D1 bindings config
│   ├── package.json
│   ├── tsconfig.json
│   │
│   ├── src/
│   │   │
│   │   # ── ENTRY POINT ──────────────────────────────────────
│   │   ├── index.ts                    # Hono router → mounts all routes
│   │   │
│   │   # ── ROUTES ───────────────────────────────────────────
│   │   ├── routes/
│   │   │   ├── projects.ts             # POST /project, GET /project/:id
│   │   │   ├── floors.ts               # POST /floor, GET /floor/:id
│   │   │   ├── rooms.ts                # POST /room, PATCH /room/:id
│   │   │   ├── objects.ts              # POST /object, PATCH /object/:id, DELETE /object/:id
│   │   │   ├── circuits.ts             # POST /circuit, GET /circuits/:floor_id
│   │   │   ├── drivers.ts              # POST /driver, GET /drivers/:floor_id
│   │   │   ├── dashboard.ts            # GET /dashboard-summary/:project_id
│   │   │   └── reports.ts              # GET /project-report/:project_id
│   │   │
│   │   # ── CALCULATION ENGINES ──────────────────────────────
│   │   ├── engines/
│   │   │   │
│   │   │   ├── geometryEngine.ts       # Spatial calculations
│   │   │   │   # exports:
│   │   │   │   #   computePolygonArea(coords[]) → number
│   │   │   │   #   computePerimeter(coords[]) → number
│   │   │   │   #   computeCoverageRadius(mountH, workPlaneH, beamAngle) → number
│   │   │   │   #   computeSpacing(objects[]) → SpacingResult
│   │   │   │   #   computeWallOffset(object, polygon) → number
│   │   │   │   #   detectOverlaps(objects[]) → OverlapResult[]
│   │   │   │   #   isObjectInsidePolygon(x, y, polygon) → boolean
│   │   │   │
│   │   │   ├── lightingEngine.ts       # Photometric calculations
│   │   │   │   # exports:
│   │   │   │   #   computeRoomLux(room, objects[]) → LuxResult
│   │   │   │   #     - lumen method: E = (N × Φ × UF × MF) / A
│   │   │   │   #     - UF from CIE tables (reflectance + RCR lookup)
│   │   │   │   #     - MF (maintenance factor) from object type
│   │   │   │   #   computeUniformity(luxGrid[][]) → number  (Emin/Eavg)
│   │   │   │   #   detectDarkPatches(luxGrid[][]) → DarkPatch[]
│   │   │   │   #   computeRoomCavityRatio(room) → number
│   │   │   │   #   deriveStatus(achieved, target) → 'good'|'underlit'|'overlit'
│   │   │   │
│   │   │   └── electricalEngine.ts     # Electrical calculations
│   │   │       # exports:
│   │   │       #   sumRoomLoad(objects[]) → number (watts)
│   │   │       #   sumFloorLoad(rooms[]) → number (watts)
│   │   │       #   groupCircuits(objects[], phases) → CircuitGroup[]
│   │   │       #   computeMCBRating(load) → number (A)
│   │   │       #   computeWireSize(load, length) → number (mm²)
│   │   │       #   allocateDrivers(objects[]) → DriverAllocation[]
│   │   │       #   countDaliAddresses(objects[]) → DaliCount
│   │   │
│   │   # ── ORCHESTRATOR ─────────────────────────────────────
│   │   ├── orchestrator/
│   │   │   └── recalcCascade.ts        # THE CORE CASCADE ENGINE
│   │   │       # Triggered on every object mutation
│   │   │       # Step 1: recalcRoom(room_id)
│   │   │       #   → geometryEngine (area, perimeter, coverage)
│   │   │       #   → lightingEngine (lux, uniformity, status)
│   │   │       #   → PATCH rooms SET achieved_lux, uniformity, status
│   │   │       # Step 2: recalcFloor(floor_id)
│   │   │       #   → sum area + load across rooms
│   │   │       #   → electricalEngine (circuits, MCB, wire)
│   │   │       #   → PATCH floors SET total_area, total_load
│   │   │       # Step 3: recalcProject(project_id)
│   │   │       #   → aggregate all floor totals
│   │   │       #   → PATCH projects SET updated_at
│   │   │       # Step 4: log to calculation_log
│   │   │
│   │   # ── DATA ACCESS LAYER ─────────────────────────────────
│   │   ├── db/
│   │   │   ├── queries/
│   │   │   │   ├── projectQueries.ts
│   │   │   │   ├── floorQueries.ts
│   │   │   │   ├── roomQueries.ts
│   │   │   │   ├── objectQueries.ts
│   │   │   │   └── circuitQueries.ts
│   │   │   └── db.ts                   # D1 client wrapper + typed helpers
│   │   │
│   │   # ── TYPES ────────────────────────────────────────────
│   │   ├── types/
│   │   │   ├── models.ts               # DB row types (Project, Floor, Room…)
│   │   │   ├── engineTypes.ts          # Engine input/output contracts
│   │   │   │   # LuxResult, SpacingResult, CircuitGroup,
│   │   │   │   # OverlapResult, DriverAllocation, DaliCount
│   │   │   └── api.ts                  # Request/Response DTOs
│   │   │
│   │   # ── MIDDLEWARE ───────────────────────────────────────
│   │   └── middleware/
│   │       ├── auth.ts                 # API key validation
│   │       ├── validate.ts             # Zod schema validation
│   │       └── errorHandler.ts         # Structured error responses
│   │
│   └── tests/
│       ├── engines/
│       │   ├── geometryEngine.test.ts
│       │   ├── lightingEngine.test.ts
│       │   └── electricalEngine.test.ts
│       └── routes/
│           ├── objects.test.ts
│           └── dashboard.test.ts
│
# ================================================================
# NEXT.JS FRONTEND — Display & Input Only
# ================================================================
├── frontend/
│   ├── next.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   │
│   ├── src/
│   │   │
│   │   ├── app/                        # Next.js App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # Landing / project list
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx
│   │   │   └── project/
│   │   │       └── [projectId]/
│   │   │           ├── layout.tsx      # Project shell (sidebar + header)
│   │   │           ├── page.tsx        # Redirect → canvas
│   │   │           ├── canvas/
│   │   │           │   └── page.tsx    # Main design canvas view
│   │   │           ├── floors/
│   │   │           │   └── [floorId]/
│   │   │           │       └── page.tsx
│   │   │           ├── electrical/
│   │   │           │   └── page.tsx    # Circuits + Drivers view
│   │   │           ├── dashboard/
│   │   │           │   └── page.tsx    # Summary (reads computed data only)
│   │   │           └── report/
│   │   │               └── page.tsx    # Printable PDF report
│   │   │
│   │   ├── components/
│   │   │   │
│   │   │   ├── canvas/                 # CANVAS — visual input layer only
│   │   │   │   ├── DesignCanvas.tsx    # Konva/Fabric stage wrapper
│   │   │   │   ├── CanvasToolbar.tsx   # Tool selector (place/select/move)
│   │   │   │   ├── GridLayer.tsx       # Background grid
│   │   │   │   ├── RoomLayer.tsx       # Renders room polygons
│   │   │   │   ├── ObjectLayer.tsx     # Renders all placed objects
│   │   │   │   ├── HeatmapOverlay.tsx  # Lux heatmap (data from Worker)
│   │   │   │   └── objects/
│   │   │   │       ├── DownlightSymbol.tsx
│   │   │   │       ├── LinearSymbol.tsx
│   │   │   │       ├── PanelSymbol.tsx
│   │   │   │       ├── WallWasherSymbol.tsx
│   │   │   │       ├── SwitchSymbol.tsx
│   │   │   │       └── SensorSymbol.tsx
│   │   │   │
│   │   │   ├── panels/                 # Side panels — properties only
│   │   │   │   ├── ObjectPropertiesPanel.tsx
│   │   │   │   ├── RoomPropertiesPanel.tsx
│   │   │   │   ├── CircuitPanel.tsx
│   │   │   │   └── DriverPanel.tsx
│   │   │   │
│   │   │   ├── dashboard/              # Read-only computed result cards
│   │   │   │   ├── ProjectSummaryCard.tsx
│   │   │   │   ├── FloorSummaryCard.tsx
│   │   │   │   ├── RoomStatusBadge.tsx
│   │   │   │   ├── LuxGauge.tsx
│   │   │   │   ├── UniformityBar.tsx
│   │   │   │   └── LoadBreakdownChart.tsx
│   │   │   │
│   │   │   └── ui/                     # Shadcn/ui base components
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Select.tsx
│   │   │       └── ...
│   │   │
│   │   ├── hooks/
│   │   │   ├── useProject.ts           # SWR: fetch/mutate project
│   │   │   ├── useRoom.ts              # SWR: fetch room + computed results
│   │   │   ├── useObject.ts            # Mutate → POST/PATCH /object
│   │   │   ├── useDashboard.ts         # SWR: GET /dashboard-summary
│   │   │   └── useCanvas.ts            # Konva state, tool mode, selection
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                  # Typed fetch wrapper → Worker base URL
│   │   │   ├── constants.ts            # Lux standards table, MCB ratings, etc.
│   │   │   └── utils.ts                # Unit converters (mm ↔ ft, px ↔ mm)
│   │   │
│   │   └── types/
│   │       └── index.ts                # Shared TS types (mirrored from worker)
│   │
│   └── public/
│       ├── symbols/                    # SVG object symbols for canvas
│       │   ├── downlight.svg
│       │   ├── linear.svg
│       │   ├── panel.svg
│       │   ├── wall-washer.svg
│       │   ├── switch.svg
│       │   └── sensor.svg
│       └── lux-tables/
│           └── CIE_UF_table.json       # Utilization factor lookup table
│
# ================================================================
# SHARED PACKAGES (monorepo)
# ================================================================
└── packages/
    ├── types/                          # Shared TypeScript types
    │   ├── package.json
    │   ├── src/
    │   │   ├── models.ts
    │   │   ├── engineTypes.ts
    │   │   └── api.ts
    │   └── tsconfig.json
    │
    └── constants/                      # Shared constants
        ├── package.json
        └── src/
            ├── luxStandards.ts         # EN 12464-1 lux targets by room type
            ├── electricalRatings.ts    # MCB sizes, wire sizes, derating factors
            └── objectDefaults.ts       # Default props per object type
