content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

old = "    // When no floor plan, the room-fill Rect handles clicks via its own onClick \xe2\x80\x94 don't double-fire\n    if (!floorPlan) return"
new = "    // When no floor plan, fall through to handleRoomClick directly\n    if (!floorPlan) { handleRoomClick(e); return }"

if old in content:
    content = content.replace(old, new, 1)
    print("Stage fallback fix applied")
else:
    print("FAILED - searching:")
    lines = content.split("\n")
    for i, line in enumerate(lines, 1):
        if "floorPlan" in line and "double-fire" in line or "floorPlan" in line and "room-fill" in line:
            print(f"  {i}: {line.strip()}")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
