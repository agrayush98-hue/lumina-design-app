content = open("src/App.jsx", encoding="utf-8").read()

old = "    // Calculate lumens using activeFixture's calculateLumens function\n    const fixtureLumens = activeFixture.calculateLumens?.(defaultPower, defaultChip) ?? (defaultPower * 90)"

new = "    // Calculate lumens using activeFixture's actual lumens or calculateLumens\n    const fixtureLumens = activeFixture.lumens ?? activeFixture.calculateLumens?.(defaultPower, defaultChip) ?? (defaultPower * 90)\n    console.log(\"[autoPlace] fixture:\", activeFixture.id, \"lumens:\", fixtureLumens, \"power:\", defaultPower)"

if old in content:
    content = content.replace(old, new, 1)
    print("Fix applied")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
