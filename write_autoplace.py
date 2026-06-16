content = open("src/App.jsx", encoding="utf-8").read()

# Find the start and end of autoPlaceLights function
start_marker = "  function autoPlaceLights() {"
end_marker = "  // \xe2\x94\x80\xe2\x94\x80 Handle AutoPl"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1:
    print("START NOT FOUND")
elif end_idx == -1:
    print("END NOT FOUND")
else:
    print(f"Function starts at char {start_idx}")
    print(f"Function ends at char {end_idx}")
    print("Current function length:", end_idx - start_idx, "chars")
    # Show first 200 chars of function
    print("Current start:")
    print(content[start_idx:start_idx+300])
