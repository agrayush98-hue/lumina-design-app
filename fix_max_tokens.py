content = open("workers/ai-recommender/index.js", encoding="utf-8").read()

old = "          model: \"claude-opus-4-6\",\n          max_tokens: 1000,\n          messages: [{ role: \"user\", content: [\n            { type: \"image\", source: { type: \"base64\", media_type: mediaType || \"image/jpeg\", data: image } },"

new = "          model: \"claude-opus-4-6\",\n          max_tokens: 4000,\n          messages: [{ role: \"user\", content: [\n            { type: \"image\", source: { type: \"base64\", media_type: mediaType || \"image/jpeg\", data: image } },"

if old in content:
    content = content.replace(old, new, 1)
    print("max_tokens increased to 4000")
else:
    print("FAILED")

open("workers/ai-recommender/index.js", "w", encoding="utf-8").write(content)
print("Saved")
