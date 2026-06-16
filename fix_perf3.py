content = open("src/App.jsx", encoding="utf-8").read()

old = "  const luxBreakdown = computeLuxBreakdown(lights, areaM2, uf)"
new = "  const luxBreakdown = useMemo(() => computeLuxBreakdown(lights, areaM2, uf), [lights, areaM2, uf])"

if old in content:
    content = content.replace(old, new, 1)
    print("useMemo added to luxBreakdown")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
