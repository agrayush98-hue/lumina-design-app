lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "roomOffsetX" in line or "drawnWidthPx" in line or "roomBound" in line:
        if i < 500:
            print(f"{i}: {lines[i-1].rstrip()}")
