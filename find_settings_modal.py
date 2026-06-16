lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "showSettings &&" in line:
        print(f"{i}: {lines[i-1].rstrip()}")
