content = open("src/App.jsx", encoding="utf-8").read()

# Add normalize helper before handleLoadFromModal
normalize_fn = """  function normalizeIds(floors) {
    return (floors || []).map(f => ({
      ...f,
      id: String(f.id),
      activeRoomId: String(f.activeRoomId ?? f.rooms?.[0]?.id ?? "1"),
      rooms: (f.rooms || []).map(r => ({ ...r, id: String(r.id) }))
    }))
  }

  """

old_fn = "  function handleLoadFromModal(id, data) {"
if old_fn in content:
    content = content.replace(old_fn, normalize_fn + old_fn, 1)
    print("normalize helper added")
else:
    print("FAILED to add helper")

# Fix line 1219
old1 = "      setFloors(data.floors)\n      setActiveFloorId(data.floors[0]?.id ?? 1)"
new1 = "      const nf = normalizeIds(data.floors)\n      setFloors(nf)\n      setActiveFloorId(String(nf[0]?.id ?? \"1\"))"
if old1 in content:
    content = content.replace(old1, new1, 1)
    print("Fix 1: handleLoadFromModal normalized")
else:
    print("Fix 1 FAILED")

# Fix line 1271
old2 = "            setFloors(tpl.floors)\n            setActiveFloorId(tpl.floors[0]?.id ?? 1)"
new2 = "            const tf = normalizeIds(tpl.floors)\n            setFloors(tf)\n            setActiveFloorId(String(tf[0]?.id ?? \"1\"))"
if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Fix 2: template load normalized")
else:
    print("Fix 2 FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
