lines = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").readlines()
for i in range(184, 200):
    print(f"{i+1}: {lines[i].rstrip()}")
