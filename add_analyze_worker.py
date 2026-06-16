lines = open("workers/ai-recommender/index.js", encoding="utf-8").readlines()

# Find line 235 where roomType destructuring is
for i, line in enumerate(lines, 1):
    if "const { roomType, widthM" in line:
        print(f"Found at line {i}")
        insert_at = i - 1  # 0-indexed
        break

analyze_block = (
    "    // Route: /analyze - Floor plan vision analysis\n"
    "    const reqUrl = new URL(request.url)\n"
    "    if (reqUrl.pathname === \"/analyze\") {\n"
    "      const { image, mediaType } = body\n"
    "      if (!image) {\n"
    "        return new Response(JSON.stringify({ error: \"No image provided\" }), {\n"
    "          status: 400, headers: { ...headers, \"Content-Type\": \"application/json\" }\n"
    "        })\n"
    "      }\n"
    "      const ar = await fetch(\"https://api.anthropic.com/v1/messages\", {\n"
    "        method: \"POST\",\n"
    "        headers: { \"Content-Type\": \"application/json\", \"x-api-key\": env.ANTHROPIC_API_KEY, \"anthropic-version\": \"2023-06-01\" },\n"
    "        body: JSON.stringify({\n"
    "          model: \"claude-opus-4-6\",\n"
    "          max_tokens: 1000,\n"
    "          messages: [{ role: \"user\", content: [\n"
    "            { type: \"image\", source: { type: \"base64\", media_type: mediaType || \"image/jpeg\", data: image } },\n"
    "            { type: \"text\", text: \"Analyze this floor plan. Identify rooms, estimate dimensions in meters, identify room type. Return ONLY valid JSON: {\\\"rooms\\\": [{\\\"name\\\": string, \\\"type\\\": string, \\\"widthM\\\": number, \\\"heightM\\\": number}], \\\"summary\\\": string}\" }\n"
    "          ]}]\n"
    "        })\n"
    "      })\n"
    "      const ad = await ar.json()\n"
    "      const txt = ad.content?.[0]?.text ?? \"{}\"\n"
    "      const clean = txt.replace(/^```(?:json)?\\s*/i, \"\").replace(/\\s*```$/, \"\").trim()\n"
    "      return new Response(clean, { status: 200, headers: { ...headers, \"Content-Type\": \"application/json\" } })\n"
    "    }\n\n"
)

new_lines = lines[:insert_at] + [analyze_block] + lines[insert_at:]
open("workers/ai-recommender/index.js", "w", encoding="utf-8").write("".join(new_lines))
print(f"Done. Lines: {len(lines)} -> {len(new_lines)}")
