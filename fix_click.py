content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

# The issue: SCALE uses CANVAS_W=1400 but actual container is smaller
# Fix: check if click coords are within room bounds before rejecting
old = "    if (activeTool === \"fixture\") {\n      onAddLight({ id: crypto.randomUUID(), x, y })"
new = "    if (activeTool === \"fixture\") {\n      // Debug: log placement coords\n      console.log(\"[place] x:\", x, \"y:\", y, \"roomW:\", roomWidth, \"roomH:\", roomHeight)\n      onAddLight({ id: crypto.randomUUID(), x, y })"

if old in content:
    content = content.replace(old, new, 1)
    print("Debug log added")
else:
    print("Pattern not found")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
