content = open("src/App.jsx", encoding="utf-8").read()

old = "  function addLight(lightData) {\n    const now = Date.now()\n    if (now - lastAddLightTime.current < 100) return"
new = "  function addLight(lightData) {\n    const now = Date.now()\n    console.log(\"[addLight called] lightData:\", lightData, \"activeFixture:\", activeFixture?.id, \"activeFixtureCategory:\", activeFixtureCategory)\n    if (now - lastAddLightTime.current < 100) return"

if old in content:
    content = content.replace(old, new, 1)
    print("Debug added to addLight")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
