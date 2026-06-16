content = open("workers/ai-recommender/index.js", encoding="utf-8").read()

old = '    "Access-Control-Allow-Headers": "Content-Type",'
new = '    "Access-Control-Allow-Headers": "Content-Type, X-App-Token",'

if old in content:
    content = content.replace(old, new, 1)
    print("CORS fix applied")
else:
    print("FAILED")

open("workers/ai-recommender/index.js", "w", encoding="utf-8").write(content)
print("Saved")
