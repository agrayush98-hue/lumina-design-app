content = open("src/App.jsx", encoding="utf-8").read()

# Fix 1: Initial state - make Floor 1 activeRoomId consistent
# The saved project has activeRoomId as string "1" but room id as number 1
# Solution: normalize on load AND fix handleStageClick to not require room-fill

open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

dc = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

# Fix handleStageClick to fallback to handleRoomClick when no room-fill target
old = """  function handleStageClick(e) {
    if (e.target !== e.currentTarget) return
    if (isPanning.current) return
    if (isStripMode) return
    if (activeTool === "draw-room") return"""

new = """  function handleStageClick(e) {
    if (isPanning.current) return
    if (isStripMode) return
    if (activeTool === "draw-room") return"""

if old in dc:
    dc = dc.replace(old, new, 1)
    print("Fix 1: removed e.target !== e.currentTarget guard")
else:
    print("Fix 1 FAILED")

# Fix 2: also remove the room-fill name check
old2 = "    if (!floorPlan) {\n      const raw = { x: e.evt.offsetX, y: e.evt.offsetY }\n      const pos = toWorld(raw)\n      if (!insideRoom(pos.x, pos.y)) return\n    }"
new2 = "    const _raw = { x: e.evt.offsetX, y: e.evt.offsetY }\n    const _pos = toWorld(_raw)\n    if (!insideRoom(_pos.x, _pos.y)) return"

if old2 in dc:
    dc = dc.replace(old2, new2, 1)
    print("Fix 2: stage click now checks insideRoom directly")
else:
    print("Fix 2 FAILED - searching:")
    lines = dc.split("\n")
    for i, line in enumerate(lines, 1):
        if "insideRoom" in line and i > 550 and i < 580:
            print(f"  {i}: {line}")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(dc)
print("DesignCanvas saved")
