content = open("src/App.jsx", encoding="utf-8").read()

# Add the handler function near updateFloorPlan
old = "  function updateFloorPlan(data) {\n    patchActiveFloor(() => ({ floorPlan: data }))\n  }"
new = (
    "  function updateFloorPlan(data) {\n    patchActiveFloor(() => ({ floorPlan: data }))\n  }\n\n"
    "  async function handleAnalyzeFloorPlan(floorPlan) {\n"
    "    if (!floorPlan?.url) return\n"
    "    showToast(\"Analyzing floor plan...\")\n"
    "    try {\n"
    "      const base64 = floorPlan.url.split(\",\")[1]\n"
    "      const mediaType = floorPlan.url.split(\";\")[0].split(\":\")[1]\n"
    "      const res = await fetch(import.meta.env.VITE_AI_WORKER_URL + \"/analyze\", {\n"
    "        method: \"POST\",\n"
    "        headers: { \"Content-Type\": \"application/json\" },\n"
    "        body: JSON.stringify({ image: base64, mediaType })\n"
    "      })\n"
    "      const data = await res.json()\n"
    "      if (data.error) { showToast(\"Analysis failed: \" + data.error); return }\n"
    "      showToast(\"Analysis complete: \" + (data.summary ?? \"Done\"))\n"
    "      console.log(\"[floorplan analysis]\", data)\n"
    "    } catch(e) {\n"
    "      showToast(\"Analysis failed\")\n"
    "    }\n"
    "  }\n"
)

if old in content:
    content = content.replace(old, new, 1)
    print("Handler added")
else:
    print("FAILED")

# Add prop to RoomSettingsFloating
old2 = "              activeTool={activeTool}\n              onSetActiveTool={setActiveTool}\n              embedded"
new2 = "              activeTool={activeTool}\n              onSetActiveTool={setActiveTool}\n              onAnalyzeFloorPlan={handleAnalyzeFloorPlan}\n              embedded"

if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Prop wired")
else:
    print("Prop wire FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
