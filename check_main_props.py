lines = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").readlines()
for i in range(160, 185):
    print(f"{i+1}: {lines[i].rstrip()}")
