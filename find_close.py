content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if i >= 3358 and i <= 3375:
        print(f"{i}: {repr(line)}")
