content = open("src/App.jsx", encoding="utf-8").read()

old = "    // Default power: first option from powerOptions\n    const defaultPower = activeFixture.powerOptions?.[0] ?? 12"
new = "    // Default power: middle option from powerOptions (not weakest)\n    const _pwrOpts = activeFixture.powerOptions ?? []\n    const _midIdx = Math.floor(_pwrOpts.length / 2)\n    const defaultPower = _pwrOpts[_midIdx]?.watt ?? activeFixture.watt ?? 12"

if old in content:
    content = content.replace(old, new, 1)
    print("Power fix applied")
else:
    print("FAILED")

# Also fix lumens to use middle option
old2 = "    // Calculate lumens using activeFixture's actual lumens or calculateLumens\n    const fixtureLumens = activeFixture.lumens ?? activeFixture.calculateLumens?.(defaultPower, defaultChip) ?? (defaultPower * 90)"
new2 = "    // Calculate lumens using middle power option\n    const fixtureLumens = _pwrOpts[_midIdx]?.lumens ?? activeFixture.lumens ?? activeFixture.calculateLumens?.(defaultPower, defaultChip) ?? (defaultPower * 90)\n    console.log(\"[autoPlace] power:\", defaultPower, \"lumens:\", fixtureLumens)"

if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Lumens fix applied")
else:
    print("Lumens fix FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
