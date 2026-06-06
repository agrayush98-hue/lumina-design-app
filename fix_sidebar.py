content = open("src/App.jsx", encoding="utf-8").read()

# Find the Sidebar component and add display:none wrapper
old = '        <Sidebar activeItem={sidebarView} onItemChange={handleSidebarChange}>'
new = '        <Sidebar activeItem={sidebarView} onItemChange={handleSidebarChange} style={{ display: "none" }}>'

if old in content:
    content = content.replace(old, new, 1)
    print("Sidebar hidden")
else:
    print("FAILED - Sidebar tag not found")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
