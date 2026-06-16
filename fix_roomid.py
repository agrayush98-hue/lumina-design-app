content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

# Fix 1: room ID comparison - use == instead of === or convert both to string
old = "const isActive = r.id === activeRoomId"
new = "const isActive = String(r.id) === String(activeRoomId)"

if old in content:
    content = content.replace(old, new)
    print("Fix 1 applied: room ID comparison fixed")
else:
    print("Fix 1 FAILED - searching for pattern:")
    lines = content.split("\n")
    for i, line in enumerate(lines, 1):
        if "isActive" in line and "activeRoomId" in line:
            print(f"  Line {i}: {line.strip()}")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
