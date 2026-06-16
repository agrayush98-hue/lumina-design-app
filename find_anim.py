lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "animRef" in line or "requestAnimationFrame" in line or "rAF" in line:
        print(f"{i}: {lines[i-1].rstrip()}")
