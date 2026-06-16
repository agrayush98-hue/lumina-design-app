lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "offset" in line.lower() or "getBounding" in line.lower() or "clientX" in line.lower() or "getPointerPosition" in line.lower():
        print(f"{i}: {line.rstrip()}")
