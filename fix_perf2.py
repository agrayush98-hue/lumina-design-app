lines = open("src/App.jsx", encoding="utf-8").readlines()
new_lines = [l for i, l in enumerate(lines, 1) if i != 1158]
open("src/App.jsx", "w", encoding="utf-8").write("".join(new_lines))
print(f"Done. Lines: {len(lines)} -> {len(new_lines)}")
