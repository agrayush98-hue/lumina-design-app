# Check if the sidebar style attribute caused issues
content = open("src/components/Sidebar.jsx", encoding="utf-8").read()
if "display: none" in content or "pointer-events" in content:
    print("Found display:none or pointer-events in Sidebar")
else:
    print("No display issues in Sidebar")
    
# Check App.jsx for the hidden sidebar style we added
content2 = open("src/App.jsx", encoding="utf-8").read()
if 'display: "none"' in content2 or "display: none" in content2:
    print("Found display:none in App.jsx - this may be blocking clicks")
    lines = content2.split("\n")
    for i, line in enumerate(lines, 1):
        if 'display: "none"' in line or "display: none" in line:
            print(f"  Line {i}: {line.strip()}")
else:
    print("No display:none in App.jsx")
