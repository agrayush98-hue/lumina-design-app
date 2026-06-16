lines = open("src/components/FixtureLibraryPanel.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "onSelect" in line or "handleSelect" in line:
        print(f"{i}: {lines[i-1].rstrip()}")
