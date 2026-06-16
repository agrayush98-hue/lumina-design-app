lines = open("src/data/fixtureLibrary.js", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "COB" in line or "lumens" in line.lower() or "watt" in line.lower():
        if i < 100:
            print(f"{i}: {lines[i-1].rstrip()}")
