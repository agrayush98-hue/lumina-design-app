lines = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").readlines()
for i in range(100, 145):
    print(f"{i+1}: {lines[i].rstrip()}")
