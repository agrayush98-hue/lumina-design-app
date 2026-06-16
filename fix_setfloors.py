content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")

# Show context around line 1219
print("=== Line 1219 context ===")
for i in range(1215, 1225):
    print(f"{i+1}: {lines[i]}")

print("\n=== Line 1271 context ===")
for i in range(1267, 1277):
    print(f"{i+1}: {lines[i]}")
