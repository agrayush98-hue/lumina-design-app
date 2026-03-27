# Backend Architecture — v3 Change Log
## Production-Safety Improvements

---

## 1 · Recalculation Queue — Durable Object Debounce

### Why not in-memory / setTimeout

Cloudflare Workers run in V8 isolates that are **stateless between requests**.
There is no shared heap between two Worker invocations, no event loop that
persists after a response is sent, and no `setTimeout` that survives beyond
the active request context. Any in-memory debounce will silently disappear.

The only Cloudflare-native mechanism for deferred, stateful execution is the
**Durable Objects Alarms API** (`storage.setAlarm(timestampMs)`). An alarm
survives DO eviction, is guaranteed at-least-once delivery by the CF runtime,
and calling `setAlarm()` with a new timestamp *replaces* the existing alarm —
which is exactly the debounce behaviour required.

### Architecture

```
Object mutation (POST/PATCH/DELETE)
        │
        ▼
  objects.ts route
        │
        ├─ 1. Write mutation to D1 base_objects
        │
        ├─ 2. Mark room dirty:
        │      UPDATE rooms SET is_dirty=1,
        │        dirty_since = COALESCE(dirty_since, now())
        │
        ├─ 3. Upsert recalc_queue (scope escalation via SQL CASE)
        │
        ├─ 4. PUT /enqueue → RecalcDurableObject (idFromName = roomId)
        │      DO stores entry, calls setAlarm(now + 400ms)
        │      Each new mutation RESETS the alarm → debounce
        │
        └─ 5. Return 202 Accepted immediately
                  (cascade has NOT run yet)

        ← 400ms of silence →

RecalcDurableObject.alarm() fires
        │
        ├─ Read entry from DO storage (scope, triggeredBy)
        ├─ Call recalcCascade(db, roomId, scope, ...)
        ├─ On success: UPDATE rooms SET is_dirty=0, dirty_since=NULL
        ├─ DELETE FROM recalc_queue WHERE room_id=?
        └─ Clear DO storage
```

### Scope escalation during debounce window

If a user drags a fixture (scope=room) and then immediately changes its
dimming type (scope=floor) before the 400ms elapses:

```
Mutation 1 → DO stores {scope: 'room'}  alarm set T+400ms
Mutation 2 → DO reads existing, computes maxScope('room','floor') = 'floor'
             DO stores {scope: 'floor'} alarm RESET to T+400ms
Alarm fires → cascade runs at scope='floor' ✓
```

`maxScope()` uses numeric weights: room=1, floor=2, project=3.

### Eviction safety — recalc_queue as persistent fallback

DOs can be evicted under memory pressure. The `recalc_queue` D1 table
is a persistent mirror of all pending recalcs:

```sql
recalc_queue(room_id PK, floor_id, project_id, scope, triggered_by,
             enqueued_at, attempt_count)
```

A cron Worker (`* * * * *`, CF minimum = 60s) scans for rows where
`enqueued_at < now - 2s AND attempt_count < 3` and re-enqueues them
into the DO. Rows with `attempt_count >= 3` are dead-lettered: dirty
flag is cleared and the row is deleted to prevent infinite retries.

### API response change

All object mutation routes now return **202 Accepted** (not 200 OK)
with `{ queued: true, scope: 'floor', reason: '...' }`. The frontend
must poll `GET /api/rooms/:id` or use a webhook to detect when
`is_dirty` returns to 0.

---

## 2 · Incremental Recalculation — Scope Engine

### Problem with v2

v2 ran the full three-step cascade (room → floor → project) on every
object mutation regardless of what changed. Moving a fixture 10mm ran
circuit-grouping for the entire floor — unnecessary and slow.

### Scope decision table

`scopeEngine.deriveScope(changedFields)` inspects the patch payload keys:

| Changed field(s)                                          | Scope   | Steps run                        |
|-----------------------------------------------------------|---------|----------------------------------|
| `x`, `y`, `rotation`, `mounting_height`                  | `room`  | geometry + lighting              |
| `watt`, `lumens`, `beam_angle`, `length`, `lumens_per_m` | `room`  | lighting only (skip geometry)    |
| `reflectance_*`, `target_lux`, `ceiling_height`          | `room`  | lighting only                    |
| `polygon_coordinates`, `working_plane_height`             | `room`  | geometry + lighting              |
| `dimming_type`, `circuit_id`                              | `floor` | lighting + electrical regroup    |
| `control_group_id`                                        | `project` | lighting + electrical + drivers |
| New object placed / object deleted                        | `floor` | geometry + lighting + electrical |
| `body_color`, `label`, non-photometric fields             | `room`  | no cascade (skip entirely)       |

### Step execution matrix

```
Scope    │ runGeometry │ runLighting │ runElectrical │ runDriverAlloc
─────────┼─────────────┼─────────────┼───────────────┼───────────────
room     │  if spatial │     ✓       │      ✗        │      ✗
floor    │     ✓       │     ✓       │      ✓        │      ✗
project  │     ✓       │     ✓       │      ✓        │      ✓
```

For `room` scope with a lighting-only change (no spatial delta),
`runGeometry = false` and the cascade reuses stored `area`/`perimeter`
values — saving the polygon area + perimeter computation entirely.

### Scope is authoritative in the cascade

`recalcCascade()` receives the scope and enforces step execution —
it does not trust the route to decide. This means if a DO re-enqueues
after eviction with an escalated scope, the cascade will correctly
run the broader set of steps.

---

## 3 · Spatial Index

### spatial_bucket column

Added to `base_objects`:
```sql
spatial_bucket  TEXT  NOT NULL  DEFAULT '0_0'
```

Formula: `floor(x / 500) || '_' || floor(y / 500)`

Bucket side = 500mm. A standard 6×4m room contains ~12×8 = 96 buckets.
A typical downlight at 1 200mm centres has a coverage radius of ~600mm,
fitting neatly within a 2×2 bucket region.

### Two maintenance layers

**SQL triggers** (schema_v3.sql) keep `spatial_bucket` consistent
automatically on every INSERT and UPDATE of `x` or `y`:

```sql
CREATE TRIGGER trg_objects_spatial_update
  AFTER UPDATE OF x, y ON base_objects
  BEGIN
    UPDATE base_objects
    SET spatial_bucket =
      CAST(CAST(NEW.x/500 AS INTEGER) AS TEXT) || '_' ||
      CAST(CAST(NEW.y/500 AS INTEGER) AS TEXT)
    WHERE id = NEW.id;
  END;
```

**Worker function** `computeSpatialBucket(x, y)` produces the same
string and is used when building the INSERT payload, so the D1 trigger
and the Worker always agree on bucket format.

### Composite index

```sql
CREATE INDEX idx_objects_spatial ON base_objects(room_id, spatial_bucket);
```

Queries that ask "give me all objects in buckets ['2_1','2_2','3_1',...]
within room X" hit this index with a single range scan.

### getNearbyObjects() — three-step lookup

```typescript
getNearbyObjects(objects, targetX, targetY, radiusMm)
```

1. Compute target bucket from `(targetX, targetY)`
2. Generate the 3×3 Moore neighbourhood (9 bucket keys)
3. Filter `objects` array to those in neighbour set  → O(n) pass
4. Apply exact Euclidean `√(dx²+dy²) ≤ radius`       → O(k) pass, k ≪ n

**Performance gain example** — 200 fixtures in a 10×10m room:
- Naive O(n²) overlap check: 200×199/2 = **19 900 distance comparisons**
- Bucket pre-filter: each fixture checks only ~9 bucket-neighbours.
  Average ~4 fixtures per bucket → **~800 comparisons total (96% reduction)**

Used by:
- `detectOverlapsIndexed()` — coverage overlap warnings
- `lightingEngine._calcPointSource()` — per-fixture shadow/overlap reporting
- Future: dark-patch detection on a per-cell lux grid

---

## 4 · Calculation Confidence

### Why lux accuracy varies

The lumen method produces accurate results when:
- The room is a simple convex rectangle
- All fixtures are of the same type (single calc mode)
- Coverage is well-distributed (no large gaps or heavy overlaps)
- The room is roughly square (gradient is low)

Confidence degrades when any of these break down. Returning a numeric
confidence signal lets the frontend warn designers before they commit
to a final layout.

### Four factors

| Factor               | Weight | Penalised when                              |
|----------------------|--------|---------------------------------------------|
| Geometry Complexity  |  30%   | >8 vertices, non-convex polygon             |
| Fixture Homogeneity  |  30%   | 2+ distinct calc modes (mixed)              |
| Coverage Ratio       |  25%   | <40% or >200% of room area covered          |
| Aspect Ratio         |  15%   | bounding box ratio > 4:1                    |

Each factor produces a 0–100 penalty. Weighted sum → `score` (0–100).

### Confidence bucketing

```
score  <  20  →  'high'    (result is reliable)
score  < 50   →  'medium'  (minor approximation, flag in UI)
score  ≥ 50   →  'low'     (significant uncertainty, show warning)
```

### Geometry convexity test

Uses the **cross-product sign test** on consecutive vertex triples.
All cross products must share the same sign (all clockwise or all
counter-clockwise). A sign change means a reflex angle → non-convex.

### Stored fields

```sql
rooms.calc_confidence  TEXT  CHECK IN ('high','medium','low')   -- written on every room recalc
calculation_log.calc_confidence                                  -- archived per run
```

The `ConfidenceResult` object also returns a `warnings[]` array with
human-readable messages (e.g. `"Non-convex polygon — lumen method approximation applies"`)
that the frontend can display in the properties panel.

---

## Schema Delta — v2 → v3

| Table            | Column              | Change                                                        |
|------------------|---------------------|---------------------------------------------------------------|
| `rooms`          | `is_dirty`          | **NEW** `INTEGER DEFAULT 0` — dirty flag                      |
| `rooms`          | `dirty_since`       | **NEW** `TEXT` — ISO8601 first-dirty timestamp                |
| `rooms`          | `calc_scope`        | **NEW** `TEXT` — last cascade scope                           |
| `rooms`          | `calc_confidence`   | **NEW** `TEXT CHECK IN ('high','medium','low')`               |
| `base_objects`   | `spatial_bucket`    | **NEW** `TEXT DEFAULT '0_0'` — pre-computed grid cell         |
| `recalc_queue`   | *(whole table)*     | **NEW TABLE** — persistent queue for DO alarm recovery        |
| `calculation_log`| `calc_scope`        | **NEW** `TEXT` — scope that ran                               |
| `calculation_log`| `calc_confidence`   | **NEW** `TEXT` — confidence at time of run                    |

## New Files — v3

| File                                         | Purpose                                        |
|----------------------------------------------|------------------------------------------------|
| `orchestrator/RecalcDurableObject.ts`         | DO class: debounce alarm + cascade executor    |
| `orchestrator/scopeEngine.ts`                 | Derives CalcScope from changed fields          |
| `engines/confidenceEngine.ts`                 | Scores calc quality: high / medium / low       |
| `cron/queueRecovery.ts`                       | Scheduled handler: re-enqueues stale DO items  |

## Modified Files — v3

| File                                | Change summary                                    |
|-------------------------------------|---------------------------------------------------|
| `routes/objects.ts`                 | Returns 202, calls scopeEngine, enqueues DO       |
| `orchestrator/recalcCascade.ts`     | Accepts CalcScope, skips unnecessary steps        |
| `engines/geometryEngine.ts`         | computeSpatialBucket, getNearbyObjects added       |
| `types/engineTypes.ts`              | CalcScope, ConfidenceResult, MutationFields added  |
| `wrangler.toml`                     | DO binding + migrations + cron trigger added       |
| `index.ts`                          | Exports DO class, adds scheduled handler           |
