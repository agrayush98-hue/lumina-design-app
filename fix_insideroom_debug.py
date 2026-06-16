content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

old = "  function insideRoom(x, y) {\n    return x >= ROOM_X && x <= ROOM_X + ROOM_PX_W && y >= ROOM_Y && y <= ROOM_Y + ROOM_PX_H\n  }"

new = "  function insideRoom(x, y) {\n    console.log(\"[insideRoom] x:\", x, \"y:\", y, \"ROOM_X:\", ROOM_X, \"ROOM_Y:\", ROOM_Y, \"ROOM_PX_W:\", ROOM_PX_W, \"ROOM_PX_H:\", ROOM_PX_H)\n    return x >= ROOM_X && x <= ROOM_X + ROOM_PX_W && y >= ROOM_Y && y <= ROOM_Y + ROOM_PX_H\n  }"

if old in content:
    content = content.replace(old, new, 1)
    print("Debug added")
else:
    print("FAILED")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
