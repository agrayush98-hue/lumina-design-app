lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "[DesignCanvas] activeFixtureCategory" in line:
        print(f"Found at line {i}: {line.strip()}")
