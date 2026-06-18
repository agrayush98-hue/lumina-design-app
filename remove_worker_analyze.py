content = open("workers/ai-recommender/index.js", encoding="utf-8").read()

start_marker = "    // Route: /analyze - Floor plan vision analysis"
end_marker = "    const { roomType, widthM"

start = content.find(start_marker)
end = content.find(end_marker)

if start != -1 and end != -1 and end > start:
    content = content[:start] + content[end:]
    print("Analyze endpoint removed from worker")
else:
    print("FAILED - start:", start, "end:", end)

open("workers/ai-recommender/index.js", "w", encoding="utf-8").write(content)
print("Saved")
