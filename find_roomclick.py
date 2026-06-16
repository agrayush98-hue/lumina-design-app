lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if i >= 1825 and i <= 1850:
        print(f"{i}: {lines[i-1].rstrip()}")
