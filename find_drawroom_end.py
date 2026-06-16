lines = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").readlines()
for i in range(120, 130):
    print(f"{i+1}: {repr(lines[i].rstrip())}")
