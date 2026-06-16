lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "addLight" in line and "function" in line or "addLight" in line and "const" in line and "=>" in line:
        print(f"{i}: {line.rstrip()}")
