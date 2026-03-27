// ============================================================
// LIGHTING & AUTOMATION DESIGN PLATFORM
// Worker Engines + Orchestration  ·  v3
// ============================================================
// FILE MAP (v3 additions and changes only):
//
//   NEW  workers/src/orchestrator/RecalcDurableObject.ts
//        — Durable Object: holds debounce alarm, executes cascade
//
//   NEW  workers/src/orchestrator/scopeEngine.ts
//        — Derives minimum required recalc scope from changed fields
//
//   NEW  workers/src/engines/confidenceEngine.ts
//        — Scores calculation confidence: high / medium / low
//
//   MOD  workers/src/orchestrator/recalcCascade.ts
//        — Accepts CalcScope, runs only required steps
//
//   MOD  workers/src/engines/geometryEngine.ts
//        — computeSpatialBucket(), getNeighborBuckets(),
//          getNearbyObjects() using spatial_bucket index
//
//   MOD  workers/src/types/engineTypes.ts
//        — CalcScope, ConfidenceResult, MutationFields added
//
//   MOD  workers/src/routes/objects.ts
//        — Calls scopeEngine, marks dirty, enqueues DO alarm
//          instead of calling recalcCascade() directly
//
//   MOD  workers/wrangler.toml
//        — Durable Object binding added
// ============================================================


// ============================================================
// workers/src/types/engineTypes.ts  ·  v3 additions
// (append to existing v2 types file)
// ============================================================

// Ordered by impact weight — used for scope escalation in queue
export type CalcScope = 'room' | 'floor' | 'project'

export type CalcConfidence = 'high' | 'medium' | 'low'

// Fields that can change on a base_object or its type-specific row.
// scopeEngine inspects which keys are present to derive CalcScope.
export type MutationFields = Partial<{
  // Spatial — triggers room-scope geometry + lighting recalc
  x:               number
  y:               number
  rotation:        number
  mounting_height: number
  // Photometric — triggers room-scope lighting recalc only
  watt:            number
  lumens:          number
  lumens_per_meter:number
  beam_angle:      number
  length:          number
  // Electrical — triggers floor-scope circuit regroup
  dimming_type:    string
  circuit_id:      string
  // Control — triggers project-scope driver reallocation
  control_group_id:string
  // Room geometry — triggers room-scope recalc
  polygon_coordinates: string
  ceiling_height:      number
  false_ceiling_drop:  number
  working_plane_height:number
  reflectance_ceiling: string
  reflectance_walls:   string
  reflectance_floor:   string
  target_lux:          number
}>

export interface ScopeDecision {
  scope:          CalcScope
  reason:         string          // human-readable, for logging
  runGeometry:    boolean
  runLighting:    boolean
  runElectrical:  boolean         // floor-level circuit regroup
  runDriverAlloc: boolean         // project-level driver reallocation
}

export interface ConfidenceResult {
  confidence:     CalcConfidence
  score:          number           // 0–100 internal score before bucketing
  factors: {
    geometryComplexity:  number    // 0–100, penalises non-convex shapes
    fixtureHomogeneity:  number    // 0–100, penalises mixed calc modes
    coverageRatio:       number    // 0–100, penalises under/over coverage
    aspectRatioPenalty:  number    // 0–100, penalises extreme proportions
  }
  warnings: string[]              // e.g. "Non-convex polygon detected"
}

// Extend CascadeResult
export interface CascadeResult {
  scope:       CalcScope
  geoResult:   GeoResult   | null   // null if scope skipped geometry
  luxResult:   LuxResult   | null
  elecResult:  ElecResult  | null
  confidence:  ConfidenceResult | null
  durationMs:  number
}


// ============================================================
// workers/src/orchestrator/scopeEngine.ts  (NEW)
// ============================================================
// Determines the minimum cascade scope required for a given set
// of changed fields. This prevents running the full cascade for
// trivial mutations like rotating a fixture.
//
// SCOPE HIERARCHY (ascending impact):
//
//   'room'    — recalc geometry + lighting for the affected room only
//               Triggered by: position, orientation, photometric props,
//               room shape, room height, reflectances, target_lux
//
//   'floor'   — room-scope + regroup circuits for the whole floor
//               Triggered by: dimming_type change, circuit_id reassignment,
//               adding or removing a luminaire (watt contributes to load)
//
//   'project' — floor-scope + reallocate DALI drivers across all floors
//               Triggered by: control_group_id change, object type change
//               that crosses a dimming protocol boundary
//
// ESCALATION RULE (recalc_queue):
//   If a room already has a pending queue entry at scope S1 and a new
//   mutation arrives with scope S2, the stored scope is updated to
//   MAX(S1, S2). This ensures no information is lost during debounce.
// ============================================================

import type { MutationFields, ScopeDecision, CalcScope } from '../types/engineTypes'

const SCOPE_WEIGHT: Record<CalcScope, number> = {
  room:    1,
  floor:   2,
  project: 3,
}

export function maxScope(a: CalcScope, b: CalcScope): CalcScope {
  return SCOPE_WEIGHT[a] >= SCOPE_WEIGHT[b] ? a : b
}

// Fields that affect only room-level geometry and lux
const ROOM_SCOPE_FIELDS: (keyof MutationFields)[] = [
  'x', 'y', 'rotation', 'mounting_height',
  'watt', 'lumens', 'lumens_per_meter', 'beam_angle', 'length',
  'polygon_coordinates', 'ceiling_height', 'false_ceiling_drop',
  'working_plane_height', 'reflectance_ceiling', 'reflectance_walls',
  'reflectance_floor', 'target_lux',
]

// Fields that require floor-level electrical recalculation
const FLOOR_SCOPE_FIELDS: (keyof MutationFields)[] = [
  'dimming_type',
  'circuit_id',
]

// Fields that require project-level driver reallocation
const PROJECT_SCOPE_FIELDS: (keyof MutationFields)[] = [
  'control_group_id',
]

export const scopeEngine = {

  deriveScope(changedFields: MutationFields, isNewObject = false, isDeletedObject = false): ScopeDecision {
    // Adding or removing any luminaire always affects floor load totals
    if (isNewObject || isDeletedObject) {
      return {
        scope:          'floor',
        reason:         isNewObject ? 'New object placed — floor load recalc required' : 'Object removed — floor load recalc required',
        runGeometry:    true,
        runLighting:    true,
        runElectrical:  true,
        runDriverAlloc: false,
      }
    }

    const keys = Object.keys(changedFields) as (keyof MutationFields)[]

    // Check for project-scope triggers first (highest priority)
    if (keys.some(k => PROJECT_SCOPE_FIELDS.includes(k))) {
      return {
        scope:          'project',
        reason:         `Control group reassignment — driver reallocation required`,
        runGeometry:    keys.some(k => ROOM_SCOPE_FIELDS.includes(k)),
        runLighting:    keys.some(k => ROOM_SCOPE_FIELDS.includes(k)),
        runElectrical:  true,
        runDriverAlloc: true,
      }
    }

    // Floor-scope triggers
    if (keys.some(k => FLOOR_SCOPE_FIELDS.includes(k))) {
      const affectsRoom = keys.some(k => ROOM_SCOPE_FIELDS.includes(k))
      return {
        scope:          'floor',
        reason:         `Dimming/circuit change — floor electrical recalc required`,
        runGeometry:    affectsRoom,
        runLighting:    affectsRoom,
        runElectrical:  true,
        runDriverAlloc: false,
      }
    }

    // Room-scope only (most common case: move, rotate, spec change)
    if (keys.some(k => ROOM_SCOPE_FIELDS.includes(k))) {
      // Distinguish geometry-only vs lighting-only to save engine time
      const spatialFields: (keyof MutationFields)[] = ['x', 'y', 'polygon_coordinates', 'ceiling_height', 'false_ceiling_drop', 'working_plane_height']
      const hasGeometryChange = keys.some(k => spatialFields.includes(k))
      return {
        scope:          'room',
        reason:         hasGeometryChange
                          ? 'Position/geometry change — room recalc'
                          : 'Photometric property change — lighting recalc',
        runGeometry:    hasGeometryChange,
        runLighting:    true,
        runElectrical:  false,
        runDriverAlloc: false,
      }
    }

    // No known lighting-relevant field changed (e.g. body_color, label)
    return {
      scope:          'room',
      reason:         'Non-photometric change — no cascade required',
      runGeometry:    false,
      runLighting:    false,
      runElectrical:  false,
      runDriverAlloc: false,
    }
  },
}


// ============================================================
// workers/src/orchestrator/RecalcDurableObject.ts  (NEW)
// ============================================================
// Cloudflare Durable Object — one instance per room_id.
//
// WHY A DURABLE OBJECT?
// ─────────────────────
// Cloudflare Workers are stateless and isolate-scoped. There is
// no shared in-memory state between requests. setTimeout() does
// not persist across requests. The ONLY Cloudflare-native
// mechanism for debounced execution is the Durable Object
// Alarms API (setAlarm), which survives eviction and guarantees
// at-least-once delivery.
//
// HOW DEBOUNCE WORKS HERE
// ───────────────────────
// 1. A mutation arrives at the objects.ts route.
// 2. Route calls DO stub = env.RECALC_DO.idFromName(roomId)
//    and sends a PUT /enqueue request to the DO.
// 3. DO.fetch('PUT /enqueue') receives the scope and triggeredBy,
//    stores them in DO storage, then calls:
//      this.ctx.storage.setAlarm(Date.now() + DEBOUNCE_MS)
//    If an alarm already exists, setAlarm() REPLACES it —
//    this is the debounce: every new edit pushes the alarm forward.
// 4. When no further edits arrive within 400ms, the alarm fires.
// 5. DO.alarm() reads scope + triggeredBy from storage, calls the
//    recalcCascade Worker via service binding, then clears itself.
//
// SCOPE ESCALATION IN THE DO
// ──────────────────────────
// If two mutations arrive for the same room before the alarm fires,
// the DO merges them by taking MAX(scope1, scope2). This ensures the
// cascade runs at the highest required scope, not the most recent.
//
// EVICTION SAFETY
// ───────────────
// The recalc_queue D1 table is the persistent fallback. If the DO
// is evicted before its alarm fires, the Worker cron (every 60s)
// scans recalc_queue for rows older than 2s and re-enqueues them
// by sending a fresh PUT /enqueue to the DO.
// ============================================================

import type { DurableObjectState, DurableObjectEnv } from '@cloudflare/workers-types'
import type { CalcScope }  from '../types/engineTypes'
import { maxScope }        from './scopeEngine'
import { recalcCascade }   from './recalcCascade'

const DEBOUNCE_MS = 400

interface QueueEntry {
  roomId:      string
  floorId:     string
  projectId:   string
  scope:       CalcScope
  triggeredBy: string
  enqueuedAt:  number   // Date.now()
}

export class RecalcDurableObject {
  private state: DurableObjectState
  private env:   DurableObjectEnv & { DB: D1Database }

  constructor(state: DurableObjectState, env: DurableObjectEnv & { DB: D1Database }) {
    this.state = state
    this.env   = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // PUT /enqueue — called by objects route on every mutation
    if (request.method === 'PUT' && url.pathname === '/enqueue') {
      const incoming = await request.json() as QueueEntry

      // Load existing entry (if any) and escalate scope
      const existing = await this.state.storage.get<QueueEntry>('entry')
      const mergedScope: CalcScope = existing
        ? maxScope(existing.scope, incoming.scope)
        : incoming.scope

      const entry: QueueEntry = {
        ...incoming,
        scope:       mergedScope,
        enqueuedAt:  existing?.enqueuedAt ?? Date.now(),  // preserve original timestamp
      }

      await this.state.storage.put('entry', entry)

      // (Re-)schedule alarm — replaces any existing alarm = debounce
      await this.state.storage.setAlarm(Date.now() + DEBOUNCE_MS)

      return new Response(JSON.stringify({ queued: true, scope: mergedScope }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // GET /status — diagnostic endpoint
    if (request.method === 'GET' && url.pathname === '/status') {
      const entry = await this.state.storage.get<QueueEntry>('entry')
      const alarm = await this.state.storage.getAlarm()
      return new Response(JSON.stringify({ entry, alarmAt: alarm }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response('Not found', { status: 404 })
  }

  // Called by CF runtime when the alarm fires (400ms after last enqueue)
  async alarm(): Promise<void> {
    const entry = await this.state.storage.get<QueueEntry>('entry')
    if (!entry) return   // already processed or spurious alarm

    try {
      await recalcCascade(
        this.env.DB,
        entry.roomId,
        entry.triggeredBy,
        entry.scope,
        'object_edit',
      )

      // Mark room clean in D1
      await this.env.DB.prepare(`
        UPDATE rooms
        SET is_dirty = 0, dirty_since = NULL, calc_scope = ?
        WHERE id = ?
      `).bind(entry.scope, entry.roomId).run()

      // Remove from persistent queue
      await this.env.DB.prepare(
        'DELETE FROM recalc_queue WHERE room_id = ?'
      ).bind(entry.roomId).run()

    } catch (err) {
      // Increment attempt_count — cron will re-enqueue if < 3 attempts
      await this.env.DB.prepare(`
        UPDATE recalc_queue SET attempt_count = attempt_count + 1
        WHERE room_id = ?
      `).bind(entry.roomId).run()
      // Re-throw so CF runtime can log it
      throw err
    } finally {
      // Always clear DO storage regardless of success/failure
      await this.state.storage.delete('entry')
    }
  }
}


// ============================================================
// workers/src/routes/objects.ts  ·  v3  (mutation entry point)
// ============================================================
// On every object mutation:
//   1. Compute spatial_bucket for new x/y
//   2. Write mutation to D1
//   3. Mark room dirty (is_dirty=1, dirty_since=now if not already set)
//   4. Upsert recalc_queue with escalated scope
//   5. Send PUT /enqueue to Durable Object → sets/resets alarm
//   6. Return immediately (202 Accepted) — DO runs cascade async
// ============================================================

import { Hono }       from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z }          from 'zod'
import { insertObject, updateObject, deleteObject, getObjectById } from '../db/queries/objectQueries'
import { scopeEngine, maxScope } from '../orchestrator/scopeEngine'
import { computeSpatialBucket } from '../engines/geometryEngine'
import type { Env }   from '../index'
import type { CalcScope } from '../types/engineTypes'

const router = new Hono<{ Bindings: Env }>()

const BaseObjectSchema = z.object({
  room_id:          z.string().uuid(),
  object_type:      z.enum(['downlight','spotlight','panel_light','diffuser',
                             'linear_light','wall_washer','switch','sensor']),
  x:                z.number(),
  y:                z.number(),
  rotation:         z.number().default(0),
  mounting_height:  z.number().optional(),
  fixture_library_id: z.string().optional(),
  circuit_id:       z.string().optional(),
  control_group_id: z.string().optional(),
  dimming_type:     z.enum(['non-dim','phase_cut','0-10v','dali','casambi']).default('non-dim'),
  properties:       z.record(z.unknown()),
})

// ── Helper: mark room dirty + upsert queue ─────────────────────
async function markDirtyAndEnqueue(
  db:          D1Database,
  doEnv:       Env,
  roomId:      string,
  floorId:     string,
  projectId:   string,
  scope:       CalcScope,
  triggeredBy: string,
): Promise<void> {
  // 1. Mark room dirty — only set dirty_since if not already dirty
  await db.prepare(`
    UPDATE rooms
    SET is_dirty   = 1,
        dirty_since = COALESCE(dirty_since, datetime('now'))
    WHERE id = ?
  `).bind(roomId).run()

  // 2. Upsert recalc_queue with scope escalation
  //    ON CONFLICT: keep enqueued_at from first mutation, escalate scope
  await db.prepare(`
    INSERT INTO recalc_queue (room_id, floor_id, project_id, scope, triggered_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET
      scope        = CASE
                       WHEN excluded.scope = 'project' THEN 'project'
                       WHEN scope = 'project'          THEN 'project'
                       WHEN excluded.scope = 'floor'   THEN 'floor'
                       WHEN scope = 'floor'             THEN 'floor'
                       ELSE 'room'
                     END,
      triggered_by = excluded.triggered_by
  `).bind(roomId, floorId, projectId, scope, triggeredBy).run()

  // 3. Notify Durable Object → sets/resets the 400ms alarm
  const doId   = doEnv.RECALC_DO.idFromName(roomId)
  const doStub = doEnv.RECALC_DO.get(doId)

  await doStub.fetch(new Request('https://do/enqueue', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, floorId, projectId, scope, triggeredBy }),
  }))
}

// ── Helper: get floor + project ids for a room ─────────────────
async function getRoomContext(db: D1Database, roomId: string) {
  const row = await db.prepare(`
    SELECT r.floor_id, f.project_id
    FROM rooms r JOIN floors f ON f.id = r.floor_id
    WHERE r.id = ?
  `).bind(roomId).first<{ floor_id: string; project_id: string }>()
  if (!row) throw new Error(`Room ${roomId} not found`)
  return row
}

// POST /api/objects — place a new object
router.post('/', zValidator('json', BaseObjectSchema), async (c) => {
  const body     = c.req.valid('json')
  const db       = c.env.DB
  const bucket   = computeSpatialBucket(body.x, body.y)
  const object   = await insertObject(db, { ...body, spatial_bucket: bucket })
  const ctx      = await getRoomContext(db, object.room_id)

  // New object always triggers floor scope (load change)
  await markDirtyAndEnqueue(
    db, c.env, object.room_id, ctx.floor_id, ctx.project_id,
    'floor', object.id,
  )

  // Return 202 — cascade runs asynchronously in DO
  return c.json({ object, queued: true, scope: 'floor' }, 202)
})

// PATCH /api/objects/:id — move, rotate, or update properties
router.patch('/:id', async (c) => {
  const id           = c.req.param('id')
  const body         = await c.req.json()
  const db           = c.env.DB
  const existing     = await getObjectById(db, id)

  // Compute new spatial_bucket if x or y changed
  const newX      = body.x ?? existing.x
  const newY      = body.y ?? existing.y
  const hasSpatial = ('x' in body) || ('y' in body)
  const patch     = hasSpatial
    ? { ...body, spatial_bucket: computeSpatialBucket(newX, newY) }
    : body

  const object   = await updateObject(db, id, patch)
  const ctx      = await getRoomContext(db, object.room_id)

  // Derive scope from changed fields
  const decision = scopeEngine.deriveScope(body)

  if (decision.runGeometry || decision.runLighting || decision.runElectrical || decision.runDriverAlloc) {
    await markDirtyAndEnqueue(
      db, c.env, object.room_id, ctx.floor_id, ctx.project_id,
      decision.scope, id,
    )
  }

  return c.json({ object, queued: decision.scope, reason: decision.reason }, 202)
})

// DELETE /api/objects/:id
router.delete('/:id', async (c) => {
  const id    = c.req.param('id')
  const db    = c.env.DB
  const obj   = await getObjectById(db, id)
  const ctx   = await getRoomContext(db, obj.room_id)

  await deleteObject(db, id)

  // Deletion always triggers floor scope
  await markDirtyAndEnqueue(
    db, c.env, obj.room_id, ctx.floor_id, ctx.project_id,
    'floor', id,
  )

  return c.json({ deleted: true, queued: true, scope: 'floor' }, 202)
})

export default router


// ============================================================
// workers/src/orchestrator/recalcCascade.ts  ·  v3
// ============================================================
// Now accepts a CalcScope and ScopeDecision to skip steps that
// are not required by the triggering mutation.
// Confidence is computed and stored alongside lux results.
// ============================================================

import { geometryEngine }   from '../engines/geometryEngine'
import { lightingEngine }   from '../engines/lightingEngine'
import { electricalEngine } from '../engines/electricalEngine'
import { confidenceEngine } from '../engines/confidenceEngine'
import { scopeEngine }      from './scopeEngine'
import { writeVersion }     from './versionWriter'
import * as roomQ   from '../db/queries/roomQueries'
import * as floorQ  from '../db/queries/floorQueries'
import * as objectQ from '../db/queries/objectQueries'
import type { CascadeResult, CalcScope } from '../types/engineTypes'

export async function recalcCascade(
  db:            D1Database,
  roomId:        string,
  triggeredBy:   string,
  scope:         CalcScope = 'room',
  triggerAction  = 'object_edit',
): Promise<CascadeResult> {
  const start = Date.now()

  // ── Pre-cascade snapshot ─────────────────────────────────────
  const room0  = await roomQ.getRoomWithPolygon(db, roomId)
  const floor0 = await floorQ.getFloor(db, room0.floor_id)
  await writeVersion(db, floor0.project_id, triggerAction)

  // Derive which steps to run from scope
  // (scope was already computed by scopeEngine in the route,
  //  but we re-derive here as the single authoritative source)
  const decision = {
    runGeometry:    scope === 'room' || scope === 'floor' || scope === 'project',
    runLighting:    scope === 'room' || scope === 'floor' || scope === 'project',
    runElectrical:  scope === 'floor' || scope === 'project',
    runDriverAlloc: scope === 'project',
  }

  let geoResult  = null
  let luxResult  = null
  let elecResult = null
  let confidence = null

  // ── STEP 1: Room — geometry + lighting ───────────────────────
  if (decision.runGeometry || decision.runLighting) {
    const room    = room0
    const objects = await objectQ.getResolvedObjectsForRoom(db, roomId)

    if (decision.runGeometry) {
      geoResult = geometryEngine.computeRoom(room)
    } else {
      // Re-use stored area/perimeter for lighting-only recalc
      geoResult = { area: room.area, perimeter: room.perimeter }
    }

    if (decision.runLighting) {
      luxResult  = lightingEngine.computeRoomLux(room, objects, geoResult)
      confidence = confidenceEngine.score(room, objects, geoResult, luxResult)

      await roomQ.patchComputedFields(db, roomId, {
        area:            geoResult.area,
        perimeter:       geoResult.perimeter,
        achieved_lux:    luxResult.achievedLux,
        uniformity:      luxResult.uniformity,
        status:          luxResult.status,
        last_calc_mode:  luxResult.calcMode,
        calc_confidence: confidence.confidence,
      })
    }
  }

  // ── STEP 2: Floor — electrical recalc ────────────────────────
  if (decision.runElectrical) {
    const floorId    = room0.floor_id
    const allRooms   = await roomQ.getRoomsForFloor(db, floorId)
    const allObjects = await objectQ.getResolvedObjectsForFloor(db, floorId)

    elecResult = electricalEngine.computeFloor(allRooms, allObjects)

    await floorQ.patchComputedFields(db, floorId, {
      total_area: allRooms.reduce((s, r) => s + r.area, 0),
      total_load: elecResult.totalLoad,
    })

    // Rebuild auto-circuits for this floor
    await db.prepare(
      `DELETE FROM circuits WHERE floor_id=? AND name LIKE 'AUTO-%'`
    ).bind(floorId).run()

    for (const c of elecResult.circuits) {
      await db.prepare(`
        INSERT INTO circuits
          (id, floor_id, name, phase, control_type, connected_load, recommended_mcb, wire_size)
        VALUES (?,?,?,?,?,?,?,?)
      `).bind(
        c.id, floorId,
        `AUTO-${c.controlType.toUpperCase()}-${c.phase}`,
        c.phase, c.controlType, c.load, c.mcb, c.wireSize,
      ).run()
    }
  }

  // ── STEP 3: Project — driver reallocation ────────────────────
  // (Only needed when control groups or dimming protocols change
  //  across floors. Electrical engine already handles per-floor
  //  DALI bus allocation; this step handles cross-floor summary.)
  if (decision.runDriverAlloc) {
    await db.prepare(`
      UPDATE projects SET updated_at = datetime('now')
      WHERE id = ?
    `).bind(floor0.project_id).run()
    // Full cross-floor driver allocation extends here in production
  }

  // ── STEP 4: Log ───────────────────────────────────────────────
  const durationMs = Date.now() - start
  await db.prepare(`
    INSERT INTO calculation_log
      (entity_type, entity_id, triggered_by, engine,
       calc_mode, calc_scope, calc_confidence, result_json, duration_ms)
    VALUES ('room', ?, ?, 'cascade', ?, ?, ?, ?, ?)
  `).bind(
    roomId, triggeredBy,
    luxResult?.calcMode   ?? null,
    scope,
    confidence?.confidence ?? null,
    JSON.stringify({ geoResult, luxResult, elecResult, confidence }),
    durationMs,
  ).run()

  return { scope, geoResult, luxResult, elecResult, confidence, durationMs }
}


// ============================================================
// workers/src/engines/geometryEngine.ts  ·  v3 additions
// (append to existing geometryEngine export object)
// ============================================================
// NEW EXPORTS:
//   computeSpatialBucket(x, y) → string
//   getNeighborBuckets(bucket)  → string[]
//   getNearbyObjects(objects, targetBucket, radius) → objects[]
// ============================================================

// ── Spatial bucket constants ───────────────────────────────────
const BUCKET_SIZE_MM = 500     // grid cell side in mm

/**
 * Compute the spatial bucket key for a canvas coordinate.
 * Mirrors the SQLite trigger formula:
 *   CAST(CAST(x/500 AS INTEGER) AS TEXT) || '_' || CAST(CAST(y/500 AS INTEGER) AS TEXT)
 *
 * Uses Math.floor to handle negative coordinates correctly
 * (e.g. x = -50 → bucket '-1_0', not '0_0').
 */
export function computeSpatialBucket(x: number, y: number): string {
  return `${Math.floor(x / BUCKET_SIZE_MM)}_${Math.floor(y / BUCKET_SIZE_MM)}`
}

/**
 * Returns the 3×3 Moore neighbourhood of bucket keys surrounding
 * a given bucket (including the bucket itself = 9 keys total).
 *
 * Used by getNearbyObjects to bound neighbor search to a 1 500mm
 * radius — no object further than 1 500mm from a bucket centre
 * can be in a non-neighbouring bucket.
 */
export function getNeighborBuckets(bucket: string): string[] {
  const [bx, by] = bucket.split('_').map(Number)
  const keys: string[] = []
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      keys.push(`${bx + dx}_${by + dy}`)
    }
  }
  return keys    // always 9 keys
}

/**
 * Filter a resolved-object list to those within `radiusMm` of a
 * target position, using spatial_bucket as a first-pass pre-filter.
 *
 * Algorithm:
 *   1. Get 9 neighbor bucket keys from target bucket
 *   2. Keep only objects whose spatial_bucket is in that set  (O(n) pass)
 *   3. Apply exact Euclidean distance filter on the survivors  (O(k) pass, k << n)
 *
 * In a room with 200 objects spread over a 10×10 m floor:
 *   Naive check: 200 distance calculations
 *   Bucket pre-filter: ~9/(10×10/0.5×0.5) = ~9/400 = ~2% → ≈4 distance calculations
 */
export function getNearbyObjects<T extends { x: number; y: number; spatial_bucket: string }>(
  objects:      T[],
  targetX:      number,
  targetY:      number,
  radiusMm:     number,
): T[] {
  const targetBucket  = computeSpatialBucket(targetX, targetY)
  const neighborKeys  = new Set(getNeighborBuckets(targetBucket))

  // Pass 1: bucket pre-filter
  const candidates = objects.filter(o => neighborKeys.has(o.spatial_bucket))

  // Pass 2: exact Euclidean filter
  const r2 = radiusMm * radiusMm
  return candidates.filter(o => {
    const dx = o.x - targetX
    const dy = o.y - targetY
    return (dx * dx + dy * dy) <= r2
  })
}

/**
 * Detects overlapping coverage zones between fixtures.
 * v3: uses spatial bucket pre-filter instead of O(n²) naive check.
 */
export function detectOverlapsIndexed(
  objects: Array<{ id: string; x: number; y: number; radius: number; spatial_bucket: string }>
): Array<{ objectA: string; objectB: string; overlapMm: number }> {
  const overlaps: Array<{ objectA: string; objectB: string; overlapMm: number }> = []

  for (const a of objects) {
    // Only check objects in the 3×3 neighbourhood
    const candidates = getNearbyObjects(objects, a.x, a.y, a.radius * 2 + BUCKET_SIZE_MM)

    for (const b of candidates) {
      if (b.id <= a.id) continue   // avoid duplicate pairs (a,b) and (b,a)
      const dist    = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
      const minDist = a.radius + b.radius
      if (dist < minDist) {
        overlaps.push({ objectA: a.id, objectB: b.id, overlapMm: minDist - dist })
      }
    }
  }
  return overlaps
}


// ============================================================
// workers/src/engines/confidenceEngine.ts  (NEW)
// ============================================================
// Scores calculation confidence based on four independent factors.
// Each factor produces a 0–100 penalty score (0 = perfect, 100 = worst).
// The final confidence is derived from the weighted average penalty.
//
// FACTOR 1 — Geometry Complexity (weight: 30%)
//   Signals: vertex count, convexity ratio, aspect ratio
//   High vertex count + non-convex shape = irregular room where the
//   lumen method over-simplifies (shadows, recesses ignored).
//   Aspect ratio > 4:1 means the room is so elongated that a single
//   average lux figure is not representative of both ends.
//
// FACTOR 2 — Fixture Homogeneity (weight: 30%)
//   Signals: number of distinct calc modes in the room
//   A single mode = accurate single-formula result.
//   Mixed mode = two or more formulas superimposed = compounding
//   approximation error from UF table mismatches.
//
// FACTOR 3 — Coverage Ratio (weight: 25%)
//   Signals: total fixture coverage area vs room area
//   Under-coverage (<40%): large dark patches not modelled.
//   Over-coverage (>200%): heavy overlap zones not modelled.
//   Target: 70–140% coverage = high confidence.
//
// FACTOR 4 — Aspect Ratio (weight: 15%)
//   Signals: bounding box width / height
//   Rooms wider than 4:1 or taller than 4:1 produce large
//   lux gradients that single-point lumen method cannot predict.
//
// BUCKETING:
//   weighted_penalty < 20  → 'high'
//   20 ≤ penalty < 50      → 'medium'
//   penalty ≥ 50           → 'low'
// ============================================================

import type {
  Room, ConfidenceResult, CalcConfidence,
  GeoResult, LuxResult
} from '../types/engineTypes'
import type { ResolvedObject } from './lightingEngine'
import { geometryEngine }     from './geometryEngine'
import { FIXTURE_CALC_MODE }  from './lightingEngine'

// Factor weights (must sum to 1.0)
const W_GEOMETRY    = 0.30
const W_HOMOGENEITY = 0.30
const W_COVERAGE    = 0.25
const W_ASPECT      = 0.15

export const confidenceEngine = {

  score(
    room:    Room,
    objects: ResolvedObject[],
    geo:     GeoResult,
    lux:     LuxResult,
  ): ConfidenceResult {
    const warnings: string[] = []

    // ── Factor 1: Geometry Complexity ───────────────────────
    const coords       = JSON.parse(room.polygon_coordinates ?? '[]') as Array<{x:number;y:number}>
    const vertexCount  = coords.length
    const isConvex     = this._isConvex(coords)
    const aspectRatio  = this._aspectRatio(coords)

    let geoPenalty = 0
    if (vertexCount > 8) {
      geoPenalty += Math.min((vertexCount - 8) * 5, 40)
      warnings.push(`Complex polygon: ${vertexCount} vertices`)
    }
    if (!isConvex) {
      geoPenalty += 30
      warnings.push('Non-convex polygon — lumen method approximation applies')
    }
    geoPenalty = Math.min(geoPenalty, 100)

    // ── Factor 2: Fixture Homogeneity ────────────────────────
    const luminaires   = objects.filter(o => FIXTURE_CALC_MODE[o.spec?.fixture_type])
    const modeSet      = new Set(luminaires.map(o => FIXTURE_CALC_MODE[o.spec.fixture_type]))
    const modeCount    = modeSet.size

    let homoPenalty = 0
    if (modeCount === 0) {
      homoPenalty = 100
      warnings.push('No luminaires placed')
    } else if (modeCount === 2) {
      homoPenalty = 25
      warnings.push('Mixed fixture types — superimposed lux result')
    } else if (modeCount >= 3) {
      homoPenalty = 50
      warnings.push('Three or more fixture categories — accuracy reduced')
    }

    // ── Factor 3: Coverage Ratio ─────────────────────────────
    const totalCoverageM2 = luminaires.reduce((sum, obj) => {
      const h    = Math.max((obj.effectiveMountingHeight - room.working_plane_height) / 1000, 0.1)
      const beam = obj.spec.beam_angle ?? 60
      const r    = h * Math.tan((beam / 2) * (Math.PI / 180))
      return sum + Math.PI * r * r
    }, 0)

    const coverageRatio = geo.area > 0 ? totalCoverageM2 / geo.area : 0
    let coveragePenalty = 0
    if (luminaires.length > 0) {
      if (coverageRatio < 0.40) {
        coveragePenalty = Math.min((0.40 - coverageRatio) * 150, 70)
        warnings.push(`Low coverage ratio: ${(coverageRatio * 100).toFixed(0)}%`)
      } else if (coverageRatio > 2.00) {
        coveragePenalty = Math.min((coverageRatio - 2.00) * 30, 40)
        warnings.push(`High overlap ratio: ${(coverageRatio * 100).toFixed(0)}%`)
      }
    }

    // ── Factor 4: Aspect Ratio ────────────────────────────────
    let aspectPenalty = 0
    if (aspectRatio > 4.0) {
      aspectPenalty = Math.min((aspectRatio - 4.0) * 12, 60)
      warnings.push(`Elongated room aspect ratio: ${aspectRatio.toFixed(1)}:1`)
    }

    // ── Weighted aggregate ────────────────────────────────────
    const score =
      W_GEOMETRY    * geoPenalty    +
      W_HOMOGENEITY * homoPenalty   +
      W_COVERAGE    * coveragePenalty +
      W_ASPECT      * aspectPenalty

    const confidence: CalcConfidence =
      score < 20 ? 'high' :
      score < 50 ? 'medium' : 'low'

    return {
      confidence,
      score: Math.round(score),
      factors: {
        geometryComplexity: Math.round(geoPenalty),
        fixtureHomogeneity: Math.round(homoPenalty),
        coverageRatio:      Math.round(coveragePenalty),
        aspectRatioPenalty: Math.round(aspectPenalty),
      },
      warnings,
    }
  },

  // ── Geometry helpers ──────────────────────────────────────────

  /** Convexity test: all cross products of consecutive edge pairs
   *  must have the same sign for a convex polygon. */
  _isConvex(coords: Array<{x:number;y:number}>): boolean {
    const n = coords.length
    if (n < 3) return true
    let sign = 0
    for (let i = 0; i < n; i++) {
      const a = coords[i]
      const b = coords[(i + 1) % n]
      const c = coords[(i + 2) % n]
      const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
      if (cross !== 0) {
        const s = cross > 0 ? 1 : -1
        if (sign === 0) { sign = s }
        else if (sign !== s) return false
      }
    }
    return true
  },

  /** Bounding box aspect ratio: max(W/H, H/W) */
  _aspectRatio(coords: Array<{x:number;y:number}>): number {
    if (coords.length < 2) return 1
    const xs = coords.map(c => c.x)
    const ys = coords.map(c => c.y)
    const w  = Math.max(...xs) - Math.min(...xs)
    const h  = Math.max(...ys) - Math.min(...ys)
    if (w === 0 || h === 0) return 1
    return Math.max(w / h, h / w)
  },
}


// ============================================================
// workers/src/cron/queueRecovery.ts  (NEW)
// Cloudflare Workers scheduled handler — runs every 60 seconds.
// Re-enqueues any room in recalc_queue where attempt_count < 3
// and enqueued_at is more than 2 seconds old (= DO eviction guard).
// Marks rooms with attempt_count >= 3 as dead-letter.
// ============================================================

import type { Env } from '../index'

export async function queueRecoveryCron(env: Env): Promise<void> {
  const db      = env.DB
  const STALE_S = 2     // seconds before we assume DO was evicted
  const MAX_ATT = 3     // max attempts before dead-letter

  // Find stale queue entries
  const stale = await db.prepare(`
    SELECT q.room_id, q.floor_id, q.project_id, q.scope,
           q.triggered_by, q.attempt_count
    FROM recalc_queue q
    WHERE q.enqueued_at < datetime('now', '-${STALE_S} seconds')
      AND q.attempt_count < ${MAX_ATT}
  `).all<{
    room_id: string; floor_id: string; project_id: string
    scope: string; triggered_by: string; attempt_count: number
  }>()

  for (const row of stale.results) {
    // Re-enqueue into Durable Object
    const doId   = env.RECALC_DO.idFromName(row.room_id)
    const doStub = env.RECALC_DO.get(doId)

    await doStub.fetch(new Request('https://do/enqueue', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        roomId:      row.room_id,
        floorId:     row.floor_id,
        projectId:   row.project_id,
        scope:       row.scope,
        triggeredBy: row.triggered_by,
      }),
    }))
  }

  // Dead-letter rooms that have exceeded max attempts
  const deadLetter = await db.prepare(`
    SELECT room_id FROM recalc_queue WHERE attempt_count >= ${MAX_ATT}
  `).all<{ room_id: string }>()

  for (const { room_id } of deadLetter.results) {
    // Clear dirty flag to prevent UI from showing perpetual spinner
    await db.prepare(`
      UPDATE rooms SET is_dirty = 0, dirty_since = NULL
      WHERE id = ?
    `).bind(room_id).run()
    // Remove from queue — manual recalc would be required
    await db.prepare(
      'DELETE FROM recalc_queue WHERE room_id = ?'
    ).bind(room_id).run()
    // In production: notify via alert/webhook that room_id failed
  }
}


// ============================================================
// workers/wrangler.toml  ·  v3  (updated)
// ============================================================
/*
name                 = "lighting-platform-api"
main                 = "src/index.ts"
compatibility_date   = "2024-09-23"
compatibility_flags  = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"

# ── D1 Database ───────────────────────────────────────────────
[[d1_databases]]
binding       = "DB"
database_name = "lighting-platform-db"
database_id   = "YOUR_D1_DATABASE_ID"

# ── Durable Object — one instance per room_id ─────────────────
[[durable_objects.bindings]]
name       = "RECALC_DO"
class_name = "RecalcDurableObject"

[[migrations]]
tag      = "v1"
new_classes = ["RecalcDurableObject"]

# ── Cron trigger — queue recovery every 60 seconds ───────────
[[triggers.crons]]
crons = ["* * * * *"]   # every minute (CF minimum granularity)

# ── Routes ───────────────────────────────────────────────────
[[routes]]
pattern   = "api.yourdomain.com/*"
zone_name = "yourdomain.com"
*/


// ============================================================
// workers/src/index.ts  ·  v3 additions
// ============================================================
// Add to existing Hono app:
//
//   import { RecalcDurableObject } from './orchestrator/RecalcDurableObject'
//   export { RecalcDurableObject }   // DO class must be exported from entry point
//
//   // Scheduled handler (cron)
//   import { queueRecoveryCron } from './cron/queueRecovery'
//
//   export default {
//     fetch:     app.fetch,
//     scheduled: (_event, env, ctx) => {
//       ctx.waitUntil(queueRecoveryCron(env))
//     },
//   }
//
// Env type update:
//   export type Env = {
//     DB:        D1Database
//     RECALC_DO: DurableObjectNamespace    // ← NEW
//     API_KEY:   string
//   }
