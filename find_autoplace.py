content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "autoPlace" in line or "Auto Place" in line or "autoPlaceLights" in line:
        if "function" in line or "const" in line:
            print(f"{i}: {line.strip()}")
