content = open("src/App.jsx", encoding="utf-8").read()

old = (
    "    if (!floorPlan?.url) return\n"
    "    console.log(\"[analyze] url type:\", floorPlan.url.substring(0, 50))\n"
    "    showToast(\"Analyzing floor plan...\")\n"
    "    try {\n"
    "      const base64 = floorPlan.url.split(\",\")[1]\n"
    "      const mediaType = floorPlan.url.split(\";\")[0].split(\":\")[1]\n"
    "      const res = await fetch(import.meta.env.VITE_AI_WORKER_URL + \"/analyze\", {"
)

new = (
    "    if (!floorPlan?.url) return\n"
    "    showToast(\"Analyzing floor plan...\")\n"
    "    try {\n"
    "      // Convert blob URL or data URL to base64\n"
    "      let base64, mediaType\n"
    "      if (floorPlan.url.startsWith(\"blob:\")) {\n"
    "        const blob = await fetch(floorPlan.url).then(r => r.blob())\n"
    "        mediaType = blob.type || \"image/jpeg\"\n"
    "        const reader = new FileReader()\n"
    "        base64 = await new Promise(res => { reader.onload = e => res(e.target.result.split(\",\")[1]); reader.readAsDataURL(blob) })\n"
    "      } else {\n"
    "        base64 = floorPlan.url.split(\",\")[1]\n"
    "        mediaType = floorPlan.url.split(\";\")[0].split(\":\")[1]\n"
    "      }\n"
    "      const res = await fetch(import.meta.env.VITE_AI_WORKER_URL + \"/analyze\", {"
)

if old in content:
    content = content.replace(old, new, 1)
    print("Base64 conversion fix applied")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
