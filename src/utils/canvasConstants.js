// ─────────────────────────────────────────────────────────────
// SHARED CANVAS GEOMETRY — must stay in sync with DesignCanvas.jsx
// ─────────────────────────────────────────────────────────────
export const CANVAS_W   = 1400
export const CANVAS_H   = 750
export const ROOM_W_MM  = 6000   // 6 m  (default room)
export const ROOM_H_MM  = 4000   // 4 m  (default room)

// px per mm — fit room into (CANVAS_W-260) × (CANVAS_H-220)
export const SCALE = Math.min(
  (CANVAS_W - 260) / ROOM_W_MM,
  (CANVAS_H - 220) / ROOM_H_MM,
) // ≈ 0.1325 px/mm

export const ROOM_PX_W = ROOM_W_MM * SCALE
export const ROOM_PX_H = ROOM_H_MM * SCALE

// DesignCanvas.jsx hardcodes ROOM_X=20, ROOM_Y=30 when no floor-plan offset
export const ROOM_X = 20
export const ROOM_Y = 30

/** Canvas pixels → room-relative millimetres */
export function pxToMm(px_x, px_y) {
  return {
    x: (px_x - ROOM_X) / SCALE,
    y: (px_y - ROOM_Y) / SCALE,
  }
}

/** Room-relative millimetres → canvas pixels */
export function mmToPx(mm_x, mm_y) {
  return {
    x: ROOM_X + mm_x * SCALE,
    y: ROOM_Y + mm_y * SCALE,
  }
}

/**
 * Compute derived room geometry for any room size.
 * Returns { scale, roomPxW, roomPxH, roomX, roomY, roomW_mm, roomH_mm, pxToMm, mmToPx }
 *
 * roomX/roomY match DesignCanvas.jsx defaults (20/30) — no floor-plan offset.
 */
export function computeRoomGeometry(roomW_mm, roomH_mm) {
  const scale   = Math.min((CANVAS_W - 260) / roomW_mm, (CANVAS_H - 220) / roomH_mm)
  const roomPxW = roomW_mm * scale
  const roomPxH = roomH_mm * scale
  const roomX   = 20   // DesignCanvas ROOM_X default
  const roomY   = 30   // DesignCanvas ROOM_Y default
  return {
    scale, roomPxW, roomPxH, roomX, roomY, roomW_mm, roomH_mm,
    pxToMm: (px_x, px_y) => ({ x: (px_x - roomX) / scale, y: (px_y - roomY) / scale }),
    mmToPx: (mm_x, mm_y) => ({ x: roomX + mm_x * scale,   y: roomY + mm_y * scale }),
  }
}
