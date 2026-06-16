lines = open("src/components/FixtureLibraryPanel.jsx", encoding="utf-8").readlines()
for i in range(85, 115):
    print(f"{i+1}: {lines[i].rstrip()}")
