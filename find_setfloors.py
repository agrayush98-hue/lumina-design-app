content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "setFloors" in line:
        print(f"{i}: {line.strip()}")
