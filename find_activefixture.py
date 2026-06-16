content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "activeFixture" in line and ("useState" in line or "= null" in line or "= {" in line):
        print(f"{i}: {line.strip()}")
