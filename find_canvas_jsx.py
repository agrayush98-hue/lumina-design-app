content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "<DesignCanvas" in line:
        for j in range(max(0,i-5), min(len(lines), i+10)):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
