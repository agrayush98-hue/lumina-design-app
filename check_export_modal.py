lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if i >= 3340 and i <= 3500 and ("#fff" in line or "#f9f9f9" in line or "#1f1f1f" in line):
        print(f"{i}: {line.rstrip()}")
