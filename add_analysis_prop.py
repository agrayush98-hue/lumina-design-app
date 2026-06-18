content = open("src/App.jsx", encoding="utf-8").read()

old = "              onRoomBoundSet={handleRoomBoundSet}"
new = "              onRoomBoundSet={handleRoomBoundSet}\n              floorPlanAnalysis={floorPlanAnalysis}"

if old in content:
    content = content.replace(old, new, 1)
    print("Prop added")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
