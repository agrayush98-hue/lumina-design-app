content = open("src/App.jsx", encoding="utf-8").read()

old = "    const { rows, cols } = calcGrid(\n      Number(room.targetLux), areaM2, uf, fixtureLumens, roomWidth, roomHeight,\n    )"

new = "    const gridResult = calcGrid(\n      Number(room.targetLux), areaM2, uf, fixtureLumens, roomWidth, roomHeight,\n    )\n    // Cap at 64 fixtures max to prevent runaway placement\n    const MAX_FIXTURES = 64\n    let { rows, cols } = gridResult\n    if (rows * cols > MAX_FIXTURES) {\n      cols = Math.round(Math.sqrt(MAX_FIXTURES * (roomWidth / roomHeight)))\n      rows = Math.ceil(MAX_FIXTURES / cols)\n    }"

if old in content:
    content = content.replace(old, new, 1)
    print("Cap fix applied")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
