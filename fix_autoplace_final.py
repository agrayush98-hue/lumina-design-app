content = open("src/App.jsx", encoding="utf-8").read()

old = (
    "    const variants = activeFixture.variants ?? []\n"
    "    const midVariant = variants[Math.floor(variants.length / 2)] ?? {}\n"
    "    const fixWatt   = midVariant.watt      ?? activeFixture.watt      ?? 12\n"
    "    const fixLumens = midVariant.lumens    ?? activeFixture.lumens    ?? (fixWatt * 90)\n"
    "    const fixBeam   = midVariant.beamAngle ?? activeFixture.beamAngle ?? 36\n"
)

new = (
    "    // Support both configurator fixtures (power/lumens) and library fixtures (variants/watt)\n"
    "    const variants = activeFixture.variants ?? []\n"
    "    const midVariant = variants[Math.floor(variants.length / 2)] ?? {}\n"
    "    const fixWatt   = activeFixture.power   ?? midVariant.watt      ?? activeFixture.watt      ?? 12\n"
    "    const fixLumens = activeFixture.lumens  ?? midVariant.lumens    ?? (fixWatt * 90)\n"
    "    const fixBeam   = activeFixture.beamAngle ?? midVariant.beamAngle ?? 36\n"
)

if old in content:
    content = content.replace(old, new, 1)
    print("Fix applied")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
