content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

old = "  function handleRoomClick(e) {\n    e.cancelBubble = true\n    if (isStripMode) return"
new = "  function handleRoomClick(e) {\n    console.log(\"[ROOM CLICK FIRED] isStripMode:\", isStripMode, \"activeTool:\", activeTool)\n    e.cancelBubble = true\n    if (isStripMode) return"

if old in content:
    content = content.replace(old, new, 1)
    print("Debug added")
else:
    print("FAILED")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
