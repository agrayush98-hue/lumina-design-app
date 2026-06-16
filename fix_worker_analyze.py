content = open("workers/ai-recommender/index.js", encoding="utf-8").read()

# Move the analyze check to BEFORE the body validation
old = "    const { roomType, widthM, heightM, ceilM, ambiance = \"Bright & Functional\", requirements = \"\" } = body\n\n    if (!roomType || !widthM || !heightM || !ceilM) {"

new = (
    "    // Route: /analyze\n"
    "    const reqUrl = new URL(request.url)\n"
    "    if (reqUrl.pathname === \"/analyze\") {\n"
    "      const { image, mediaType } = body\n"
    "      if (!image) return new Response(JSON.stringify({ error: \"No image provided\" }), { status: 400, headers: { ...headers, \"Content-Type\": \"application/json\" } })\n"
    "      const analysisRes = await fetch(\"https://api.anthropic.com/v1/messages\", {\n"
    "        method: \"POST\",\n"
    "        headers: { \"Content-Type\": \"application/json\", \"x-api-key\": env.ANTHROPIC_API_KEY, \"anthropic-version\": \"2023-06-01\" },\n"
    "        body: JSON.stringify({\n"
    "          model: \"claude-opus-4-6\",\n"
    "          max_tokens: 1000,\n"
    "          messages: [{ role: \"user\", content: [\n"
    "            { type: \"image\", source: { type: \"base64\", media_type: mediaType || \"image/jpeg\", data: image } },\n"
    "            { type: \"text\", text: \"Analyze this floor plan. Identify each room, estimate dimensions in meters, identify room type. Return ONLY JSON: {\\\"rooms\\\": [{\\\"name\\\": string, \\\"type\\\": string, \\\"widthM\\\": number, \\\"heightM\\\": number}], \\\"summary\\\": string}\" }\n"
    "          ]}]\n"
    "        })\n"
    "      })\n"
    "      const analysisData = await analysisRes.json()\n"
    "      const text = analysisData.content?.[0]?.text ?? \"{}\"\n"
    "      const clean = text.replace(/^```(?:json)?\\s*/i, \"\").replace(/\\s*```$/, \"\").trim()\n"
    "      return new Response(clean, { status: 200, headers: { ...headers, \"Content-Type\": \"application/json\" } })\n"
    "    }\n\n"
    "    const { roomType, widthM, heightM, ceilM, ambiance = \"Bright & Functional\", requirements = \"\" } = body\n\n"
    "    if (!roomType || !widthM || !heightM || !ceilM) {"
)

if old in content:
    content = content.replace(old, new, 1)
    print("Worker fixed")
else:
    print("FAILED")

# Remove the old analyze block that was in the wrong place
old2 = (
    "    // Handle floor plan analysis endpoint\n"
    "    const url = new URL(request.url)\n"
    "    if (url.pathname === \"/analyze\") {"
)
if old2 in content:
    # Find and remove old analyze block
    start = content.find(old2)
    end = content.find("    const { roomType, widthM", start)
    content = content[:start] + content[end:]
    print("Old analyze block removed")

open("workers/ai-recommender/index.js", "w", encoding="utf-8").write(content)
print("Saved")
