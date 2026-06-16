lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if i >= 971 and i <= 990:
        print(f"{i}: {lines[i-1].rstrip()}")
    if i >= 1090 and i <= 1110:
        print(f"{i}: {lines[i-1].rstrip()}")
