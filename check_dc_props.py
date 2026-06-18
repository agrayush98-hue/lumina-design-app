lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
for i in range(65, 100):
    print(f"{i+1}: {lines[i].rstrip()}")
