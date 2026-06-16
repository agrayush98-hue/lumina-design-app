content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "Desktop required" in line or "mobile" in line.lower() and "guard" in line.lower() or "innerWidth" in line:
        print(f"{i}: {line.strip()}")
