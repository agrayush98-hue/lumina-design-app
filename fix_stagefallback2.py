content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()
lines = content.split("\n")

# Show context around line 643
for i in range(638, 650):
    print(f"{i+1}: {lines[i]}")
