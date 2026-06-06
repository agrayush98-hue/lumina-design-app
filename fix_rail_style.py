content = open("src/components/Sidebar.jsx", encoding="utf-8").read()

# Make icons bigger and more visible
old = "              {Icon && <Icon size={18} color={active ? '#d4a843' : '#555555'} />}"
new = "              {Icon && <Icon size={20} color={active ? '#d4a843' : '#888888'} />}"

if old in content:
    content = content.replace(old, new)
    print("Icon size updated")
else:
    print("Pattern not found")

open("src/components/Sidebar.jsx", "w", encoding="utf-8").write(content)
print("Saved")
