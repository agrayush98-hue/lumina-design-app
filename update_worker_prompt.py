content = open("workers/ai-recommender/index.js", encoding="utf-8").read()

old = '            { type: "text", text: "Analyze this floor plan. Identify rooms, estimate dimensions in meters, identify room type. Return ONLY valid JSON: {\\"rooms\\": [{\\"name\\": string, \\"type\\": string, \\"widthM\\": number, \\"heightM\\": number}], \\"summary\\": string}" }'

new = '            { type: "text", text: "Analyze this floor plan image. For each room or space you can identify, return its bounding box as percentage of total image dimensions. Return ONLY valid JSON with no explanation: {\\"rooms\\": [{\\"name\\": string, \\"type\\": string, \\"widthM\\": number, \\"heightM\\": number, \\"box\\": {\\"x1\\": number, \\"y1\\": number, \\"x2\\": number, \\"y2\\": number}}], \\"summary\\": string} where box values are 0-100 percentage of image width/height. x1,y1 is top-left corner, x2,y2 is bottom-right corner." }'

if old in content:
    content = content.replace(old, new, 1)
    print("Worker prompt updated")
else:
    print("FAILED")

open("workers/ai-recommender/index.js", "w", encoding="utf-8").write(content)
print("Saved")
