content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

start_marker = "            {/* AI-detected room boxes overlay */}"
end_marker = "            {/* ALL room boundaries"

start = content.find(start_marker)
end = content.find(end_marker)

if start != -1 and end != -1 and end > start:
    content = content[:start] + content[end:]
    print("Overlay block removed")
else:
    print("FAILED - start:", start, "end:", end)

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
