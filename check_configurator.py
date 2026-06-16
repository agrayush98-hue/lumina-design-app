lines = open("src/components/FixtureConfigurator.jsx", encoding="utf-8").readlines()
print(f"Total lines: {len(lines)}")
for i, line in enumerate(lines, 1):
    if "onSelect" in line or "config" in line.lower() and "return" in line or "watt" in line or "lumens" in line:
        if i < 150:
            print(f"{i}: {lines[i-1].rstrip()}")
