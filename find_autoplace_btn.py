lines = open("src/App.jsx", encoding="utf-8").readlines()
for i in range(2478, 2493):
    print(f"{i+1}: {lines[i].rstrip()}")
