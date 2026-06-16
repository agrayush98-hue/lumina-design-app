lines = open("src/App.jsx", encoding="utf-8").readlines()

new_func = """  function autoPlaceLights() {
    if (!activeFixture) {
      showToast("Please select a fixture from the library first")
      return
    }

    // Room dimensions in meters
    const W = roomWidth / 1000
    const H = roomHeight / 1000
    const area = W * H

    if (area <= 0) {
      showToast("Please set room dimensions first")
      return
    }

    // Get fixture specs from variants (use middle variant)
    const variants = activeFixture.variants ?? []
    const midVariant = variants[Math.floor(variants.length / 2)] ?? {}
    const fixWatt   = midVariant.watt      ?? activeFixture.watt      ?? 12
    const fixLumens = midVariant.lumens    ?? activeFixture.lumens    ?? (fixWatt * 90)
    const fixBeam   = midVariant.beamAngle ?? activeFixture.beamAngle ?? 36

    // Calculate fixture count needed
    const targetLuxVal = Number(room.targetLux) || 300
    const UF = uf ?? 0.75
    const MF = 0.80
    const needed = Math.ceil((targetLuxVal * area) / (fixLumens * UF * MF))
    const count  = Math.min(needed, 36)

    // Grid layout
    const cols = Math.max(1, Math.round(Math.sqrt(count * (W / H))))
    const rows = Math.ceil(count / cols)

    // Pixel positions
    const SCALE     = Math.min((CANVAS_W - 260) / roomWidth, (CANVAS_H - 220) / roomHeight)
    const useDrawn  = roomOffsetX != null && drawnWidthPx != null
    const ROOM_PX_W = useDrawn ? drawnWidthPx  : roomWidth  * SCALE
    const ROOM_PX_H = useDrawn ? drawnHeightPx : roomHeight * SCALE
    const ROOM_X    = roomOffsetX != null ? roomOffsetX : 20
    const ROOM_Y    = roomOffsetY != null ? roomOffsetY : 30
    const pxPerMm   = useDrawn ? drawnWidthPx / roomWidth : SCALE

    const wallOffPx = 500 * pxPerMm
    const usableW   = ROOM_PX_W - wallOffPx * 2
    const usableH   = ROOM_PX_H - wallOffPx * 2
    const spX       = cols > 1 ? usableW / (cols - 1) : 0
    const spY       = rows > 1 ? usableH / (rows - 1) : 0

    // Generate fixtures
    const generated = []
    let ts = Date.now()
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const light = makeLight(
          ts++,
          Math.round(ROOM_X + (cols > 1 ? wallOffPx + c * spX : ROOM_X + ROOM_PX_W / 2)),
          Math.round(ROOM_Y + (rows > 1 ? wallOffPx + r * spY : ROOM_Y + ROOM_PX_H / 2)),
          activeFixture,
          fixLumens,
        )
        light.watt      = fixWatt
        light.lumens    = fixLumens
        light.beamAngle = fixBeam
        generated.push(light)
      }
    }

    const achievedLux = Math.round((generated.length * fixLumens * UF * MF) / area)
    patchActiveRoom(r => ({ lights: [...r.lights, ...generated] }))
    showToast(`Placed ${generated.length} fixtures · ${achievedLux} lux`)
  }

"""

# Replace lines 971-1095 (indices 970-1094)
new_lines = lines[:970] + [new_func] + lines[1095:]
open("src/App.jsx", "w", encoding="utf-8").write("".join(new_lines))
print(f"Done. Replaced lines 971-1095 with new function ({len(new_func.splitlines())} lines)")
