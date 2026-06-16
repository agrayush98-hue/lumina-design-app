content = open("workers/ai-recommender/index.js", encoding="utf-8").read()

old = """    if (!isAuthorized(request, env)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...headers, "Content-Type": "application/json" }
      })
    }"""

new = "    // Auth check disabled temporarily"

if old in content:
    content = content.replace(old, new, 1)
    print("Auth check removed")
else:
    print("FAILED")

open("workers/ai-recommender/index.js", "w", encoding="utf-8").write(content)
print("Saved")
