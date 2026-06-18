content = open("src/App.jsx", encoding="utf-8").read()

old1 = '                          padding: "10px 12px", background: "#f9f9f9",'
new1 = '                          padding: "10px 12px", background: "#1a1a1a",'

old2 = '<div style={{ fontFamily: "\'Inter\', sans-serif", fontSize: 14, color: checked ? "#1f1f1f" : "#666666" }}>{label}</div>'
new2 = '<div style={{ fontFamily: "\'Inter\', sans-serif", fontSize: 14, color: checked ? "#f0f0f0" : "#888888" }}>{label}</div>'

if old1 in content:
    content = content.replace(old1, new1, 1)
    print("Background fixed")
else:
    print("FAILED 1")

if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Text color fixed")
else:
    print("FAILED 2")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
