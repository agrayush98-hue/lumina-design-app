lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if i >= 3329 and i <= 3345:
        print(f"{i}: {line.rstrip()}")
