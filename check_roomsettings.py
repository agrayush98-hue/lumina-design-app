lines = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").readlines()
print(f"Total lines: {len(lines)}")
for i, line in enumerate(lines, 1):
    if "FloorPlanSection" in line or "onUpload" in line or "Analyze" in line:
        if i < 200:
            print(f"{i}: {lines[i-1].rstrip()}")
