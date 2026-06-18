lines = open("src/App.jsx", encoding="utf-8").readlines()
print("=== handler function (815-870) ===")
for i in range(815, 870):
    print(f"{i+1}: {lines[i].rstrip()}")
