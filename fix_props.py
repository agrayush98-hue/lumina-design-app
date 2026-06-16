content = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").read()

old = "function FloorPlanSection({ floorPlan, onUpload, onRemove, activeTool, onSetActiveTool, canUpload = true, onUploadBlocked })"
new = "function FloorPlanSection({ floorPlan, onUpload, onRemove, activeTool, onSetActiveTool, canUpload = true, onUploadBlocked, onAnalyzeFloorPlan })"

if old in content:
    content = content.replace(old, new, 1)
    print("Props updated")
else:
    print("FAILED")

open("src/components/RoomSettingsFloating.jsx", "w", encoding="utf-8").write(content)
print("Saved")
