content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

old = "  floorPlan,\n  floorPlanAnalysis,\n  showBeam,"
new = "  floorPlan,\n  showBeam,"

if old in content:
    content = content.replace(old, new, 1)
    print("Prop removed")
else:
    print("FAILED")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
