lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "onClick" in line or "onMouseDown" in line or "handleClick" in line or "stageClick" in line:
        print(f"{i}: {line.rstrip()}")
