content = open("src/App.jsx", encoding="utf-8").read()

old = "  function normalizeIds(floors) {"
new = """  function normalizeIds(floors) {
    console.log("[normalizeIds] input floors:", JSON.stringify((floors||[]).map(f => ({id: f.id, idType: typeof f.id, activeRoomId: f.activeRoomId, rooms: (f.rooms||[]).map(r => ({id: r.id, idType: typeof r.id}))}))))"""

if old in content:
    content = content.replace(old, new, 1)
    print("Debug added")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
