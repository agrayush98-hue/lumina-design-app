-- ============================================================
-- LIGHTING & AUTOMATION DESIGN PLATFORM
-- Cloudflare D1 Database Schema  ·  v3
-- ============================================================
-- CHANGELOG v3  (delta from v2):
--   [1] base_objects.spatial_bucket  — pre-computed grid cell key
--   [2] rooms.is_dirty               — recalc queue flag
--   [3] rooms.dirty_since            — debounce timestamp
--   [4] rooms.calc_scope             — last recalc scope written by engine
--   [5] rooms.calc_confidence        — high/medium/low quality signal
--   [6] recalc_queue table           — persistent queue for DO alarm recovery
--   [7] Index additions for queue + spatial lookups
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- FIXTURE LIBRARY  (unchanged from v2)
-- ============================================================
CREATE TABLE IF NOT EXISTS fixture_library (
  id                   TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  brand                TEXT NOT NULL,
  model                TEXT NOT NULL,
  fixture_type         TEXT NOT NULL CHECK (fixture_type IN (
                         'downlight','spotlight','wall_washer',
                         'panel_light','diffuser',
                         'linear_cove','linear_strip','linear_pendant','batten',
                         'switch','sensor'
                       )),
  watt                 REAL    NOT NULL DEFAULT 0,
  lumens               REAL    NOT NULL DEFAULT 0,
  lumens_per_meter     REAL,
  beam_angle           REAL,
  cct                  INTEGER NOT NULL DEFAULT 3000,
  cri                  INTEGER NOT NULL DEFAULT 80,
  default_dimming_type TEXT NOT NULL DEFAULT 'non-dim' CHECK (default_dimming_type IN (
                         'non-dim','phase_cut','0-10v','dali','casambi'
                       )),
  default_driver_type  TEXT NOT NULL DEFAULT 'non-dim' CHECK (default_driver_type IN (
                         'non-dim','dali','0-10v','casambi','constant-current'
                       )),
  cutout               REAL,
  size_w               REAL,
  size_h               REAL,
  ip_rating            TEXT NOT NULL DEFAULT 'IP20',
  photometric_json     TEXT,
  default_symbol       TEXT NOT NULL DEFAULT 'downlight',
  is_active            INTEGER NOT NULL DEFAULT 1,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_fixture_type   ON fixture_library(fixture_type);
CREATE INDEX idx_fixture_brand  ON fixture_library(brand);
CREATE INDEX idx_fixture_active ON fixture_library(is_active);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id                     TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name                   TEXT NOT NULL,
  client_name            TEXT,
  location               TEXT,
  unit                   TEXT NOT NULL DEFAULT 'mm' CHECK (unit IN ('mm','ft')),
  default_ceiling_height REAL NOT NULL DEFAULT 2800,
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_projects_created ON projects(created_at DESC);

-- ============================================================
-- PROJECT VERSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS project_versions (
  id                  TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id          TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number      INTEGER NOT NULL,
  label               TEXT,
  trigger_action      TEXT    NOT NULL DEFAULT 'manual' CHECK (trigger_action IN (
                        'manual','object_place','object_move','object_delete',
                        'object_edit','room_edit','floor_edit','restore'
                      )),
  snapshot_json       TEXT    NOT NULL,
  snapshot_size_bytes INTEGER,
  created_by          TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_versions_unique  ON project_versions(project_id, version_number);
CREATE INDEX       idx_versions_project  ON project_versions(project_id, version_number DESC);

-- ============================================================
-- FLOORS
-- ============================================================
CREATE TABLE IF NOT EXISTS floors (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  level_height REAL NOT NULL DEFAULT 0,
  total_area   REAL NOT NULL DEFAULT 0,
  total_load   REAL NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_floors_project ON floors(project_id);

-- ============================================================
-- ROOMS
-- v3 additions:
--   is_dirty        — 1 when a mutation has arrived but cascade has not run
--   dirty_since     — ISO timestamp of first mutation in current dirty window
--                     (used by DO to determine whether 400ms has elapsed)
--   calc_scope      — scope that last ran: room | floor | project
--   calc_confidence — quality signal returned by confidenceEngine
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id                   TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  floor_id             TEXT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  room_type            TEXT NOT NULL DEFAULT 'general',
  polygon_coordinates  TEXT NOT NULL DEFAULT '[]',

  ceiling_height       REAL NOT NULL DEFAULT 2800,
  false_ceiling_drop   REAL NOT NULL DEFAULT 0,
  working_plane_height REAL NOT NULL DEFAULT 850,

  reflectance_ceiling  TEXT NOT NULL DEFAULT 'light'  CHECK (reflectance_ceiling  IN ('white','light','medium','dark','wood')),
  reflectance_walls    TEXT NOT NULL DEFAULT 'medium' CHECK (reflectance_walls    IN ('white','light','medium','dark','wood')),
  reflectance_floor    TEXT NOT NULL DEFAULT 'dark'   CHECK (reflectance_floor    IN ('white','light','medium','dark','wood')),

  target_lux           REAL NOT NULL DEFAULT 300,

  -- ── Computed ─────────────────────────────────────────────
  area                 REAL NOT NULL DEFAULT 0,
  perimeter            REAL NOT NULL DEFAULT 0,
  achieved_lux         REAL NOT NULL DEFAULT 0,
  uniformity           REAL NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'uncalculated' CHECK (status IN (
                         'good','underlit','overlit','uncalculated'
                       )),
  last_calc_mode       TEXT CHECK (last_calc_mode IN (
                         'grid','point_source','linear','mixed',NULL
                       )),

  -- ── v3: Queue + Confidence ───────────────────────────────
  -- Dirty flag: set to 1 immediately on any object/room mutation.
  -- Reset to 0 only after cascade completes successfully.
  is_dirty             INTEGER NOT NULL DEFAULT 0,

  -- ISO8601 timestamp of the FIRST mutation in the current dirty window.
  -- Durable Object reads this to decide whether the 400ms debounce has
  -- elapsed since the window opened. NULL when is_dirty = 0.
  dirty_since          TEXT,

  -- Scope of the last cascade that ran for this room.
  -- Written by recalcCascade so the dashboard can show staleness reason.
  calc_scope           TEXT CHECK (calc_scope IN ('room','floor','project',NULL)),

  -- Confidence in the calculated result.
  -- Derived by confidenceEngine from geometry complexity + fixture mixture.
  -- Written alongside lux results on every room-scope recalc.
  calc_confidence      TEXT NOT NULL DEFAULT 'low' CHECK (calc_confidence IN (
                         'high','medium','low'
                       )),

  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_rooms_floor      ON rooms(floor_id);
CREATE INDEX idx_rooms_status     ON rooms(status);
-- v3: queue processor needs fast dirty-room enumeration per floor
CREATE INDEX idx_rooms_dirty      ON rooms(is_dirty) WHERE is_dirty = 1;

-- ============================================================
-- BASE OBJECTS
-- v3 addition: spatial_bucket
--   Pre-computed at insert/update time by the Worker (not a generated column,
--   because D1 does not support generated columns with string expressions).
--   Formula: CAST(FLOOR(x/500) AS TEXT) || '_' || CAST(FLOOR(y/500) AS TEXT)
--   e.g.  x=1200, y=750 → '2_1'
--   Bucket side = 500 mm → appropriate for rooms up to ~15 m
--   geometryEngine uses this to skip inter-bucket distance checks.
-- ============================================================
CREATE TABLE IF NOT EXISTS base_objects (
  id                 TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  room_id            TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  object_type        TEXT NOT NULL CHECK (object_type IN (
                       'downlight','spotlight','panel_light','diffuser',
                       'linear_light','wall_washer','switch','sensor'
                     )),
  fixture_library_id TEXT REFERENCES fixture_library(id) ON DELETE RESTRICT,

  x                  REAL NOT NULL DEFAULT 0,
  y                  REAL NOT NULL DEFAULT 0,
  rotation           REAL NOT NULL DEFAULT 0,
  mounting_height    REAL,

  -- v3: spatial bucket for fast neighbor lookup
  -- Worker MUST write this on every INSERT and on x/y PATCH.
  -- Value: floor(x/500) || '_' || floor(y/500)
  spatial_bucket     TEXT NOT NULL DEFAULT '0_0',

  circuit_id         TEXT REFERENCES circuits(id) ON DELETE SET NULL,
  control_group_id   TEXT REFERENCES control_groups(id) ON DELETE SET NULL,
  dimming_type       TEXT NOT NULL DEFAULT 'non-dim' CHECK (dimming_type IN (
                       'non-dim','phase_cut','0-10v','dali','casambi'
                     )),

  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_objects_room           ON base_objects(room_id);
CREATE INDEX idx_objects_type           ON base_objects(object_type);
CREATE INDEX idx_objects_fixture        ON base_objects(fixture_library_id);
CREATE INDEX idx_objects_circuit        ON base_objects(circuit_id);
CREATE INDEX idx_objects_group          ON base_objects(control_group_id);
CREATE INDEX idx_objects_dimming        ON base_objects(dimming_type);
-- v3: composite index for spatial bucket queries
CREATE INDEX idx_objects_spatial        ON base_objects(room_id, spatial_bucket);

-- ============================================================
-- RECALC QUEUE
-- Persistent durability layer for the Durable Object queue.
-- If a DO is evicted before its alarm fires, the Worker cron
-- scans this table and re-enqueues any room whose
-- dirty_since is older than 2 seconds (5× the debounce window).
-- This prevents silent recalc failures.
--
-- Lifecycle:
--   1. Object mutation arrives at Worker
--   2. Worker writes/upserts row here (conflict = update scope + ts)
--   3. Worker calls DO.scheduleAlarm(now + 400ms)
--   4. DO alarm fires → reads this table → runs cascade → deletes row
--   5. Cron (every 60s) scans for rows older than 2s → re-enqueues
-- ============================================================
CREATE TABLE IF NOT EXISTS recalc_queue (
  room_id       TEXT    PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  floor_id      TEXT    NOT NULL,
  project_id    TEXT    NOT NULL,
  -- Scope determines which cascade steps to run (see scopeEngine.ts)
  scope         TEXT    NOT NULL DEFAULT 'room' CHECK (scope IN (
                  'room','floor','project'
                )),
  -- Scope escalation: if multiple mutations arrive with different scopes
  -- before the alarm fires, take the MAX scope.
  -- room < floor < project
  enqueued_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  triggered_by  TEXT    NOT NULL,      -- last object_id that dirtied this room
  attempt_count INTEGER NOT NULL DEFAULT 0   -- for dead-letter detection
);

CREATE INDEX idx_queue_floor     ON recalc_queue(floor_id);
CREATE INDEX idx_queue_project   ON recalc_queue(project_id);
CREATE INDEX idx_queue_enqueued  ON recalc_queue(enqueued_at);

-- ============================================================
-- TYPE-SPECIFIC OBJECT TABLES  (override columns only, v2 design)
-- ============================================================
CREATE TABLE IF NOT EXISTS downlights (
  object_id           TEXT PRIMARY KEY REFERENCES base_objects(id) ON DELETE CASCADE,
  watt_override       REAL,
  lumens_override     REAL,
  beam_angle_override REAL,
  cct_override        INTEGER,
  cutout_override     REAL,
  body_color          TEXT NOT NULL DEFAULT 'white'
);

CREATE TABLE IF NOT EXISTS linear_lights (
  object_id                 TEXT PRIMARY KEY REFERENCES base_objects(id) ON DELETE CASCADE,
  length                    REAL NOT NULL DEFAULT 1200,
  lumens_per_meter_override REAL,
  driver_watt_override      REAL,
  cct_override              INTEGER,
  total_lumens              REAL NOT NULL DEFAULT 0,
  mount_type                TEXT NOT NULL DEFAULT 'recessed' CHECK (mount_type IN (
                              'recessed','surface','pendant','cove','track'
                            )),
  cct_type                  TEXT NOT NULL DEFAULT 'fixed' CHECK (cct_type IN (
                              'fixed','tunable','dynamic'
                            ))
);

CREATE TABLE IF NOT EXISTS panel_lights (
  object_id       TEXT PRIMARY KEY REFERENCES base_objects(id) ON DELETE CASCADE,
  watt_override   REAL,
  lumens_override REAL,
  cct_override    INTEGER,
  size_w_override REAL,
  size_h_override REAL
);

CREATE TABLE IF NOT EXISTS wall_washers (
  object_id          TEXT PRIMARY KEY REFERENCES base_objects(id) ON DELETE CASCADE,
  watt_override      REAL,
  lumens_override    REAL,
  cct_override       INTEGER,
  beam_type          TEXT NOT NULL DEFAULT 'asymmetric' CHECK (beam_type IN (
                       'asymmetric','symmetric','batwing'
                     )),
  wall_height        REAL NOT NULL DEFAULT 2800,
  distance_from_wall REAL NOT NULL DEFAULT 300
);

CREATE TABLE IF NOT EXISTS switches (
  object_id   TEXT PRIMARY KEY REFERENCES base_objects(id) ON DELETE CASCADE,
  gang_count  INTEGER NOT NULL DEFAULT 1 CHECK (gang_count BETWEEN 1 AND 8),
  switch_type TEXT    NOT NULL DEFAULT 'manual' CHECK (switch_type IN (
                'manual','touch','dali','knx','casambi','scene'
              ))
);

CREATE TABLE IF NOT EXISTS sensors (
  object_id         TEXT PRIMARY KEY REFERENCES base_objects(id) ON DELETE CASCADE,
  sensor_type       TEXT NOT NULL DEFAULT 'pir' CHECK (sensor_type IN (
                      'pir','microwave','daylight','combined','co2'
                    )),
  detection_radius  REAL NOT NULL DEFAULT 5000,
  protocol          TEXT NOT NULL DEFAULT 'dali' CHECK (protocol IN (
                      'dali','knx','casambi','zigbee','zwave','analog'
                    ))
);

-- ============================================================
-- CIRCUITS
-- ============================================================
CREATE TABLE IF NOT EXISTS circuits (
  id             TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  floor_id       TEXT    NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name           TEXT    NOT NULL,
  phase          TEXT    NOT NULL DEFAULT 'L1' CHECK (phase IN ('L1','L2','L3')),
  control_type   TEXT    NOT NULL DEFAULT 'non_dim' CHECK (control_type IN (
                   'non_dim','phase_cut','0-10v','dali','casambi'
                 )),
  connected_load  REAL    NOT NULL DEFAULT 0,
  recommended_mcb INTEGER NOT NULL DEFAULT 6,
  wire_size       REAL    NOT NULL DEFAULT 1.5,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_circuits_floor        ON circuits(floor_id);
CREATE INDEX idx_circuits_control_type ON circuits(control_type);

-- ============================================================
-- DRIVERS
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id          TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  floor_id    TEXT    NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  driver_type TEXT    NOT NULL DEFAULT 'dali' CHECK (driver_type IN (
                'dali','0-10v','casambi','knx','constant-current'
              )),
  capacity    REAL    NOT NULL DEFAULT 0,
  used_load   REAL    NOT NULL DEFAULT 0,
  channels    INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_drivers_floor ON drivers(floor_id);

-- ============================================================
-- CONTROL GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS control_groups (
  id           TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  floor_id     TEXT    NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  protocol     TEXT    NOT NULL DEFAULT 'dali',
  dali_address INTEGER,
  scene_count  INTEGER NOT NULL DEFAULT 4,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_groups_floor ON control_groups(floor_id);

-- ============================================================
-- CALCULATION LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS calculation_log (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  entity_type  TEXT NOT NULL CHECK (entity_type IN ('room','floor','project')),
  entity_id    TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  engine       TEXT NOT NULL,
  calc_mode    TEXT CHECK (calc_mode IN ('grid','point_source','linear','mixed',NULL)),
  -- v3: scope that was executed
  calc_scope   TEXT CHECK (calc_scope IN ('room','floor','project',NULL)),
  -- v3: confidence written alongside lux result
  calc_confidence TEXT CHECK (calc_confidence IN ('high','medium','low',NULL)),
  result_json  TEXT NOT NULL,
  duration_ms  INTEGER,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_calclog_entity  ON calculation_log(entity_type, entity_id);
CREATE INDEX idx_calclog_created ON calculation_log(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER trg_projects_updated
  AFTER UPDATE ON projects
  BEGIN UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER trg_floors_updated
  AFTER UPDATE ON floors
  BEGIN UPDATE floors SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER trg_rooms_updated
  AFTER UPDATE ON rooms
  BEGIN UPDATE rooms SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER trg_objects_updated
  AFTER UPDATE ON base_objects
  BEGIN UPDATE base_objects SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER trg_circuits_updated
  AFTER UPDATE ON circuits
  BEGIN UPDATE circuits SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER trg_drivers_updated
  AFTER UPDATE ON drivers
  BEGIN UPDATE drivers SET updated_at = datetime('now') WHERE id = NEW.id; END;

CREATE TRIGGER trg_fixture_updated
  AFTER UPDATE ON fixture_library
  BEGIN UPDATE fixture_library SET updated_at = datetime('now') WHERE id = NEW.id; END;

-- ============================================================
-- SPATIAL BUCKET MAINTENANCE TRIGGERS
-- Keep spatial_bucket consistent automatically when x or y changes.
-- Uses SQLite CAST(CAST(x/500 AS INTEGER) AS TEXT) to replicate
-- the JS floor(x/500) || '_' || floor(y/500) formula.
-- ============================================================
CREATE TRIGGER trg_objects_spatial_insert
  AFTER INSERT ON base_objects
  BEGIN
    UPDATE base_objects
    SET spatial_bucket =
      CAST(CAST(NEW.x / 500 AS INTEGER) AS TEXT) || '_' ||
      CAST(CAST(NEW.y / 500 AS INTEGER) AS TEXT)
    WHERE id = NEW.id;
  END;

CREATE TRIGGER trg_objects_spatial_update
  AFTER UPDATE OF x, y ON base_objects
  BEGIN
    UPDATE base_objects
    SET spatial_bucket =
      CAST(CAST(NEW.x / 500 AS INTEGER) AS TEXT) || '_' ||
      CAST(CAST(NEW.y / 500 AS INTEGER) AS TEXT)
    WHERE id = NEW.id;
  END;
