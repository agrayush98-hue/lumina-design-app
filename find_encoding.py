lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "â" in line or "Â" in line:
        print(f"Line {i}: {repr(line[:120])}")
