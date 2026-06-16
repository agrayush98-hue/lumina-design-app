content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "function calcGrid" in line or "calcGrid" in line and "function" in line:
        for j in range(i-1, min(len(lines), i+30)):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
