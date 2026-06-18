lines = open("src/App.jsx", encoding="utf-8").readlines()
for i in range(2834, 2845):
    print(f"{i+1}: {lines[i].rstrip()}")
print("---")
for i in range(3049, 3060):
    print(f"{i+1}: {lines[i].rstrip()}")
