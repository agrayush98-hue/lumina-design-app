lines = open("src/App.jsx", encoding="utf-8").readlines()
checks = {3399: "Floor Plan Analysis Panel", 3392: "onAnalyzeFloorPlan", 2881: "floorPlanAnalysis", 822: "handleAnalyzeFloorPlan", 394: "floorPlanAnalysis"}
for ln, expect in checks.items():
    if expect not in lines[ln-1]:
        print("MISMATCH at line", ln, "expected", expect, "got", lines[ln-1].rstrip())
del lines[3398:3440]
del lines[3391:3392]
del lines[2880:2881]
del lines[821:888]
del lines[393:394]
open("src/App.jsx", "w", encoding="utf-8").write("".join(lines))
print("Done. New line count:", len(lines))
