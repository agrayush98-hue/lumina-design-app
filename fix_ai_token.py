content = open("src/components/AIRecommender.jsx", encoding="utf-8").read()

old = '        headers: { "Content-Type": "application/json" },'
new = '        headers: { "Content-Type": "application/json", "X-App-Token": import.meta.env.VITE_APP_SECRET_TOKEN ?? "" },'

if old in content:
    content = content.replace(old, new, 1)
    print("Token header added")
else:
    print("FAILED")

open("src/components/AIRecommender.jsx", "w", encoding="utf-8").write(content)
print("Saved")
