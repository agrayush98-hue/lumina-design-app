lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "handleRoomBound" in line or "roomBoundSet" in line or "drawnWidthPx" in line:
        print(f"{i}: {lines[i-1].rstrip()}")
