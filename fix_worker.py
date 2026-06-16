content = open("workers/ai-recommender/index.js", encoding="utf-8").read()

# Fix the lux multiplier - currently 1.3 which over-estimates
old = "  const reqLm   = Math.ceil(baseLux * areaM2 * 1.3)"
new = "  const reqLm   = Math.ceil(baseLux * areaM2 * 1.0)"

if old in content:
    content = content.replace(old, new, 1)
    print("Lux multiplier fixed: 1.3 -> 1.0")
else:
    print("FAILED")

open("workers/ai-recommender/index.js", "w", encoding="utf-8").write(content)
print("Saved")
