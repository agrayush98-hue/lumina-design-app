content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "room-fill" in line and "name=" in line:
        print(f"Line {i}: {line.strip()}")
