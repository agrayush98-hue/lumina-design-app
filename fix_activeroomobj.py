content = open("src/App.jsx", encoding="utf-8").read()

old = "const activeRoomObj = activeFloor.rooms.find(r => r.id === activeRoomId) ?? activeFloor.rooms[0]"
new = "const activeRoomObj = activeFloor.rooms.find(r => String(r.id) === String(activeRoomId)) ?? activeFloor.rooms[0]"

if old in content:
    content = content.replace(old, new, 1)
    print("Fix applied")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
