content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

old = "    const stage = stageRef.current\n    if (!stage) return\n    const raw = stage.getPointerPosition()\n    if (!raw) return\n    const pos = toWorld(raw)"

new = "    const stage = stageRef.current\n    if (!stage) return\n    const raw = { x: e.evt.offsetX, y: e.evt.offsetY }\n    if (!raw) return\n    const pos = toWorld(raw)"

if old in content:
    content = content.replace(old, new, 1)
    print("Fix applied")
else:
    print("FAILED - showing context:")
    lines = content.split("\n")
    for i, line in enumerate(lines, 1):
        if "getPointerPosition" in line:
            print(f"{i}: {line}")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
