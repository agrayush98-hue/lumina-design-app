lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i in range(1800, 1825):
    print(f"{i+1}: {lines[i].rstrip()}")
