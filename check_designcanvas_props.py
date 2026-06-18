lines = open("src/App.jsx", encoding="utf-8").readlines()
for i in range(2836, 2880):
    print(f"{i+1}: {lines[i].rstrip()}")
