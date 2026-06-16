content = open("src/App.jsx", encoding="utf-8").read()

# Find the loadProject function and add normalization
old = "const activeRoomObj = activeFloor.rooms.find(r => String(r.id) === String(activeRoomId)) ?? activeFloor.rooms[0]"

if old in content:
    print("Found activeRoomObj line")
else:
    print("NOT FOUND - searching for alternatives:")
    lines = content.split("\n")
    for i, line in enumerate(lines, 1):
        if "activeRoomObj" in line:
            print(f"  {i}: {line.strip()}")
