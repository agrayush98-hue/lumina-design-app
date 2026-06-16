lines = open("src/data/fixtureLibrary.js", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if i >= 33 and i <= 120:
        print(f"{i}: {lines[i-1].rstrip()}")
