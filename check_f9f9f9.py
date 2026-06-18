lines = open("src/App.jsx", encoding="utf-8").readlines()
for i in range(3390, 3410):
    print(f"{i+1}: {lines[i].rstrip()}")
