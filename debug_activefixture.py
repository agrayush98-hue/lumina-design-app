content = open("src/App.jsx", encoding="utf-8").read()

old = "    const variants = activeFixture.variants ?? []\n    const midVariant = variants[Math.floor(variants.length / 2)] ?? {}"
new = "    console.log(\"[autoPlace] activeFixture:\", JSON.stringify(activeFixture).substring(0, 400))\n    const variants = activeFixture.variants ?? []\n    const midVariant = variants[Math.floor(variants.length / 2)] ?? {}\n    console.log(\"[autoPlace] variants count:\", variants.length, \"midVariant:\", JSON.stringify(midVariant))"

if old in content:
    content = content.replace(old, new, 1)
    print("Debug added")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
