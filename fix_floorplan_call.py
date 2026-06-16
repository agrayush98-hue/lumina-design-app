content = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").read()

old = "        activeTool={activeTool}\n        onSetActiveTool={onSetActiveTool}\n      />"
new = "        activeTool={activeTool}\n        onSetActiveTool={onSetActiveTool}\n        onAnalyzeFloorPlan={onAnalyzeFloorPlan}\n      />"

if old in content:
    content = content.replace(old, new, 1)
    print("onAnalyzeFloorPlan prop passed")
else:
    print("FAILED")

open("src/components/RoomSettingsFloating.jsx", "w", encoding="utf-8").write(content)
print("Saved")
