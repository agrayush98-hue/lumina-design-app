lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "recentCustom" in line and ("setRecent" in line or "push" in line):
        for j in range(max(0,i-3), min(len(lines),i+5)):
            print(f"{j+1}: {lines[j].rstrip()}")
        print("---")
