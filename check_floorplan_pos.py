lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "imgX" in line or "imgY" in line or "displayW" in line or "floorPlanDisplay" in line:
        if i < 200:
            print(f"{i}: {lines[i-1].rstrip()}")
