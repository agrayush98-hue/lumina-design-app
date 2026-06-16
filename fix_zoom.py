content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

old = "      const EZ = 0.15  // zoom ease (slower = smoother feel)\n      const EP = 0.20  // pan ease"
new = "      const EZ = 0.35  // zoom ease\n      const EP = 0.40  // pan ease"

if old in content:
    content = content.replace(old, new, 1)
    print("Ease values increased")
else:
    print("FAILED")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
