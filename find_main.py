content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if i >= 2440 and i <= 2460:
        print(f"{i}: {repr(line)}")
