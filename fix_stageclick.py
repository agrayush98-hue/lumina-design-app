content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

old = "    if (!floorPlan) {\n      const stage = stageRef.current\n      if (!stage) return\n      const raw = stage.getPointerPosition()\n      if (!raw) return\n      const pos = toWorld(raw)\n      if (!insideRoom(pos.x, pos.y)) return\n    }"

new = "    if (!floorPlan) {\n      const raw = { x: e.evt.offsetX, y: e.evt.offsetY }\n      const pos = toWorld(raw)\n      if (!insideRoom(pos.x, pos.y)) return\n    }"

if old in content:
    content = content.replace(old, new, 1)
    print("Fix applied")
else:
    print("FAILED - pattern not found")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
