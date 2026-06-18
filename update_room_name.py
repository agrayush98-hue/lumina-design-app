content = open("src/App.jsx", encoding="utf-8").read()

old = "  function handleRoomBoundSet({ x1, y1, widthM, heightM, drawnWidthPx, drawnHeightPx }) {"
new = "  function handleRoomBoundSet({ x1, y1, widthM, heightM, drawnWidthPx, drawnHeightPx, name }) {"

if old in content:
    content = content.replace(old, new, 1)
    print("Parameter added")
else:
    print("FAILED")

old2 = "            name: `Room ${f.rooms.length + 1}`,"
new2 = "            name: name || `Room ${f.rooms.length + 1}`,"

if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Room name applied")
else:
    print("Room name FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
