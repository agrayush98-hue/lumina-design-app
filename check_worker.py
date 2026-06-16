lines = open("workers/ai-recommender/index.js", encoding="utf-8").readlines()
for i, line in enumerate(lines, 1):
    if "roomType" in line or "pathname" in line or "analyze" in line.lower():
        print(f"{i}: {lines[i-1].rstrip()}")
