lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if i >= 985 and i <= 1010:
        print(f"{i}: {lines[i-1].rstrip()}")
