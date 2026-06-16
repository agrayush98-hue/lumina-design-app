content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "defaultRoom" in line or "DEFAULT_ROOM" in line or "id: 1" in line or "id: \"1\"" in line:
        print(f"{i}: {line.strip()}")
