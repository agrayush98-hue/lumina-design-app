content = open("src/App.jsx", encoding="utf-8").read()
start = content.find("async function handleAnalyzeFloorPlan")
end = content.find("\n  }\n", start) + 4
print(content[start:end])
