lines = open("src/App.jsx", encoding="utf-8").readlines()
for i in range(1245, 1260):
    print(f"{i+1}: {lines[i].rstrip()}")
print("---")
for i in range(421, 426):
    print(f"{i+1}: {lines[i].rstrip()}")
