content = open("src/App.jsx", encoding="utf-8").read()

old = "  // \xe2\x94\x80\xe2\x94\x80 Mobile guard \xe2\x80\x94 canvas tool requires desktop"
new = "  // \xe2\x94\x80\xe2\x94\x80 Mobile guard \xe2\x94\x80 canvas tool requires desktop"

# Just find the line and show what is before the mobile guard
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "Mobile guard" in line:
        print(f"Line {i}")
        # Show 5 lines before
        for j in range(max(0,i-5), i+3):
            print(f"{j+1}: {lines[j]}")
        break
