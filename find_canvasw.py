lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "CANVAS_W" in line or "CANVAS_H" in line:
        print(f"{i}: {line.rstrip()}")
