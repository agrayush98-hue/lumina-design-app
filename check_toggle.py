content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "Right panel toggle" in line or "chevron_right" in line or "chevron_left" in line:
        for j in range(max(0,i-2), min(len(lines), i+15)):
            print(f"{j+1}: {lines[j]}")
        print("---")
