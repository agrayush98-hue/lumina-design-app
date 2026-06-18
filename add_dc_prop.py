content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

old = "  floorPlan,\n  showBeam,"
new = "  floorPlan,\n  floorPlanAnalysis,\n  showBeam,"

if old in content:
    content = content.replace(old, new, 1)
    print("Prop added to DesignCanvas")
else:
    print("FAILED")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
