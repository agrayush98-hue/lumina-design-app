lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i in range(1062, 1070):
    print(f"{i+1}: {lines[i].rstrip()}")
