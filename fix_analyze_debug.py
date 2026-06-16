content = open("src/App.jsx", encoding="utf-8").read()

old = "    if (!floorPlan?.url) return\n    showToast(\"Analyzing floor plan...\")"
new = "    if (!floorPlan?.url) return\n    console.log(\"[analyze] url type:\", floorPlan.url.substring(0, 50))\n    showToast(\"Analyzing floor plan...\")"

if old in content:
    content = content.replace(old, new, 1)
    print("Debug added")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
