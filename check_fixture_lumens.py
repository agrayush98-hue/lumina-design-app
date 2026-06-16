content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "COB" in line or "FIXTURE_LIBRARY" in line and i < 100:
        print(f"{i}: {line.strip()}")
