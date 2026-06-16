content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if i >= 2500 and i <= 2530:
        print(f"{i}: {lines[i-1].rstrip()}")
