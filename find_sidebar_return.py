lines = open("src/components/Sidebar.jsx", encoding="utf-8").readlines()
print(f"Total lines: {len(lines)}")
for i, line in enumerate(lines, 1):
    if "return" in line and i > 50:
        print(f"Return at line {i}: {line.rstrip()}")
        for j in range(i-1, min(i+20, len(lines))):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
