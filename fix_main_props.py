content = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").read()

old = "  activeTool, onSetActiveTool,\n  embedded,\n})"
new = "  activeTool, onSetActiveTool,\n  onAnalyzeFloorPlan,\n  embedded,\n})"

if old in content:
    content = content.replace(old, new, 1)
    print("Main props updated")
else:
    print("FAILED")

open("src/components/RoomSettingsFloating.jsx", "w", encoding="utf-8").write(content)
print("Saved")
