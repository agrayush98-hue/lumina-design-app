content = open("src/App.jsx", encoding="utf-8").read()

old = "if (typeof window !== \"undefined\" && window.innerWidth < 480) return ("
new = "if (typeof window !== \"undefined\" && window.innerWidth < 768) return ("

if old in content:
    content = content.replace(old, new, 1)
    print("Reverted to 768")

# Now find the mobile guard and add useState
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "window.innerWidth < 768" in line:
        print(f"Mobile guard at line {i}: {line.strip()}")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
