content = open("src/App.jsx", encoding="utf-8").read()

old = "    console.log(\"[autoPlace] power:\", defaultPower, \"lumens:\", fixtureLumens)"
new = "    console.log(\"[autoPlace] power:\", defaultPower, \"lumens:\", fixtureLumens, \"fixture:\", JSON.stringify(activeFixture).substring(0, 300))"

if old in content:
    content = content.replace(old, new, 1)
    print("Done")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
