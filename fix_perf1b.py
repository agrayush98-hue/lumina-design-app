lines = open("src/components/DesignCanvas.jsx", encoding="utf-8").readlines()
new_lines = [l for i, l in enumerate(lines, 1) if i != 352]
open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write("".join(new_lines))
print(f"Done. Lines: {len(lines)} -> {len(new_lines)}")
