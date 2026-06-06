lines = open("src/components/Sidebar.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if i >= 90 and i <= 124:
        print(f"{i}: {line.rstrip()}")
