content = open("src/App.jsx", encoding="utf-8").read()

old = "  if (typeof window !== \"undefined\" && window.innerWidth < 768) return ("
new = "  if (typeof window !== \"undefined\" && window.innerWidth < 400) return ("

if old in content:
    content = content.replace(old, new, 1)
    print("Mobile guard threshold lowered to 400px - effectively disabled for desktop")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
