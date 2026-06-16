lines = open("src/App.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if i >= 3324 and "Export modal" in line:
        print(f"{i}: {lines[i-1].rstrip()}")
        for j in range(i-4, i+2):
            print(f"  {j+1}: {lines[j].rstrip()}")
        break
