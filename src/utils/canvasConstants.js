// ─────────────────────────────────────────────────────────────
// SHARED CANVAS GEOMETRY — must stay in sync with DesignCanvas.jsx
// ─────────────────────────────────────────────────────────────
export const CANVAS_W   = 1000
export const CANVAS_H   = 700
export const ROOM_W_MM  = 6000   // 6 m
export const ROOM_H_MM  = 4000   // 4 m

// px per mm — fit room into (CANVAS_W-260) × (CANVAS_H-220)
export const SCALE = Math.min(
  (CANVAS_W - 260) / ROOM_W_MM,
  (CANVAS_H - 220) / ROOM_H_MM,
) // = 0.12 px/mm

export const ROOM_PX_W = ROOM_W_MM * SCALE   // 720 px
export const ROOM_PX_H = ROOM_H_MM * SCALE   // 480 px

export const ROOM_X = Math.round((CANVAS_W - ROOM_PX_W) / 2) - 20  // 120 px
export const ROOM_Y = Math.round((CANVAS_H - ROOM_PX_H) / 2) + 10  // 120 px

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
 */
export function computeRoomGeometry(roomW_mm, roomH_mm) {
  const scale   = Math.min((CANVAS_W - 260) / roomW_mm, (CANVAS_H - 220) / roomH_mm)
  const roomPxW = roomW_mm * scale
  const roomPxH = roomH_mm * scale
  const roomX   = Math.round((CANVAS_W - roomPxW) / 2) - 20
  const roomY   = Math.round((CANVAS_H - roomPxH) / 2) + 10
  return {
    scale, roomPxW, roomPxH, roomX, roomY, roomW_mm, roomH_mm,
    pxToMm: (px_x, px_y) => ({ x: (px_x - roomX) / scale, y: (px_y - roomY) / scale }),
    mmToPx: (mm_x, mm_y) => ({ x: roomX + mm_x * scale,   y: roomY + mm_y * scale }),
  }
}
