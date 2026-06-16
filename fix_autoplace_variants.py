content = open("src/App.jsx", encoding="utf-8").read()

old = "    // Default power: middle option from powerOptions (not weakest)\n    const _pwrOpts = activeFixture.powerOptions ?? []\n    const _midIdx = Math.floor(_pwrOpts.length / 2)\n    const defaultPower = _pwrOpts[_midIdx]?.watt ?? activeFixture.watt ?? 12"

new = "    // Use middle variant for balanced auto-placement\n    const _variants = activeFixture.variants ?? []\n    const _midIdx = Math.floor(_variants.length / 2)\n    const _midVariant = _variants[_midIdx] ?? {}\n    const defaultPower = _midVariant.watt ?? activeFixture.watt ?? 12"

if old in content:
    content = content.replace(old, new, 1)
    print("Power fix applied")
else:
    print("Fix 1 FAILED")

old2 = "    // Calculate lumens using middle power option\n    const fixtureLumens = _pwrOpts[_midIdx]?.lumens ?? activeFixture.lumens ?? activeFixture.calculateLumens?.(defaultPower, defaultChip) ?? (defaultPower * 90)"
new2 = "    // Use middle variant lumens\n    const fixtureLumens = _midVariant.lumens ?? activeFixture.lumens ?? (defaultPower * 90)"

if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Lumens fix applied")
else:
    print("Fix 2 FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
