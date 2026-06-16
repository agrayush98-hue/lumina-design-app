content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "activeRoomId" in line and i < 500:
        print(f"{i}: {line.strip()}")
