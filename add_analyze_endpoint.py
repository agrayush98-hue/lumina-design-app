content = open("workers/ai-recommender/index.js", encoding="utf-8").read()

old = "    const { roomType, widthM, heightM, ceilM, ambiance = \"Bright & Functional\", requirements = \"\" } = body"

new = (
    "    // Handle floor plan analysis endpoint\n"
    "    const url = new URL(request.url)\n"
    "    if (url.pathname === \"/analyze\") {\n"
    "      const { image, mediaType } = body\n"
    "      if (!image) return new Response(JSON.stringify({ error: \"No image provided\" }), { status: 400, headers: { ...headers, \"Content-Type\": \"application/json\" } })\n"
    "      const analysisRes = await fetch(\"https://api.anthropic.com/v1/messages\", {\n"
    "        method: \"POST\",\n"
    "        headers: { \"Content-Type\": \"application/json\", \"x-api-key\": env.ANTHROPIC_API_KEY, \"anthropic-version\": \"2023-06-01\" },\n"
    "        body: JSON.stringify({\n"
    "          model: \"claude-opus-4-6\",\n"
    "          max_tokens: 1000,\n"
    "          messages: [{ role: \"user\", content: [\n"
    "            { type: \"image\", source: { type: \"base64\", media_type: mediaType || \"image/png\", data: image } },\n"
    "            { type: \"text\", text: \"Analyze this floor plan. Identify each room, estimate dimensions in meters, and identify room type. Return ONLY JSON: {\\\"rooms\\\": [{\\\"name\\\": string, \\\"type\\\": string, \\\"widthM\\\": number, \\\"heightM\\\": number}], \\\"summary\\\": string}\" }\n"
    "          ]}]\n"
    "        })\n"
    "      })\n"
    "      const analysisData = await analysisRes.json()\n"
    "      const text = analysisData.content?.[0]?.text ?? \"{}\"\n"
    "      try {\n"
    "        const clean = text.replace(/^```(?:json)?\\s*/i, \"\").replace(/\\s*```$/, \"\").trim()\n"
    "        return new Response(clean, { status: 200, headers: { ...headers, \"Content-Type\": \"application/json\" } })\n"
    "      } catch {\n"
    "        return new Response(JSON.stringify({ error: \"Parse failed\", raw: text }), { status: 500, headers: { ...headers, \"Content-Type\": \"application/json\" } })\n"
    "      }\n"
    "    }\n\n"
    "    const { roomType, widthM, heightM, ceilM, ambiance = \"Bright & Functional\", requirements = \"\" } = body"
)

if old in content:
    content = content.replace(old, new, 1)
    print("Analyze endpoint added")
else:
    print("FAILED")

open("workers/ai-recommender/index.js", "w", encoding="utf-8").write(content)
print("Saved")
