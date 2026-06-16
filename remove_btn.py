lines = open("src/App.jsx", encoding="utf-8").readlines()
# Remove lines 2485-2491 (indices 2484-2490)
new_lines = lines[:2484] + lines[2492:]
open("src/App.jsx", "w", encoding="utf-8").write("".join(new_lines))
print("Auto Place button removed")
print(f"Lines: {len(lines)} -> {len(new_lines)}")
