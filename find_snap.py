lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "function snap" in line or "const snap" in line:
        for j in range(i-1, min(len(lines), i+15)):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
