lines = open("src/components/RoomSettingsPanel.jsx", encoding="utf-8").readlines()
for i in range(0, 40):
    print(f"{i+1}: {lines[i].rstrip()}")
