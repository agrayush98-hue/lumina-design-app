lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "ResizeObserver" in line or "stageWidth" in line or "stageHeight" in line:
        print(f"{i}: {line.rstrip()}")
