content = open("src/App.jsx", encoding="utf-8").read()

old = "  const [showSettings,       setShowSettings]       = useState(false)"
new = "  const [showSettings,       setShowSettings]       = useState(false)\n  const [floorPlanAnalysis,  setFloorPlanAnalysis]  = useState(null)"

if old in content:
    content = content.replace(old, new, 1)
    print("State added")
else:
    print("FAILED - showing context:")
    lines = content.split("\n")
    for i, line in enumerate(lines, 1):
        if "showSettings" in line and "useState" in line:
            print(f"{i}: {repr(line)}")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
