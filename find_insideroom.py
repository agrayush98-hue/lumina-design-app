lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "function insideRoom" in line or "insideRoom" in line and "=>" in line:
        for j in range(i-1, min(len(lines), i+10)):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
