lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "handleStageClick" in line and "function" in line or "handleStageClick" in line and "const" in line:
        print(f"\n--- Found at line {i} ---")
        for j in range(i-1, min(len(lines), i+30)):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
