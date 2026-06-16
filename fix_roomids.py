content = open("src/App.jsx", encoding="utf-8").read()

# Fix 1: DEFAULT_ROOM and floor initialization - make IDs strings
old = "id: 1, name: \"Floor 1\", activeRoomId: 1, floorPlan: null,"
new = "id: \"1\", name: \"Floor 1\", activeRoomId: \"1\", floorPlan: null,"

if old in content:
    content = content.replace(old, new, 1)
    print("Fix 1: floor ID stringified")
else:
    print("Fix 1 FAILED")

old2 = "id: 1, name: \"Room 1\","
new2 = "id: \"1\", name: \"Room 1\","

if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Fix 2: room ID stringified")
else:
    print("Fix 2 FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
