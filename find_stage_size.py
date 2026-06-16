lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "width=" in line and "Stage" in "".join(lines[max(0,i-5):i+5]) or "height=" in line and "Stage" in "".join(lines[max(0,i-5):i+5]):
        if "<Stage" in "".join(lines[max(0,i-3):i+3]):
            print(f"{i}: {line.rstrip()}")
