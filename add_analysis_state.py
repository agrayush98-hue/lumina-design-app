content = open("src/App.jsx", encoding="utf-8").read()

old = "  const [showSettings,       setShowSettings]      = useState(false)"
new = "  const [showSettings,       setShowSettings]      = useState(false)\n  const [floorPlanAnalysis,  setFloorPlanAnalysis]  = useState(null)"

if old in content:
    content = content.replace(old, new, 1)
    print("State added")
else:
    print("FAILED")

# Store analysis result instead of just toasting
old2 = "      console.log(\"[floorplan analysis]\", JSON.stringify(data))\n      showToast(\"Analysis complete\")"
new2 = "      console.log(\"[floorplan analysis]\", JSON.stringify(data))\n      setFloorPlanAnalysis(data)\n      showToast(\"Analysis complete - \" + (data.rooms?.length ?? 0) + \" rooms detected\")"

if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Analysis stored in state")
else:
    print("State storage FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
