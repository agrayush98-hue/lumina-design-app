content = open("src/components/EmergencyPanel.jsx", encoding="utf-8").read()

replacements = [
    ('bg:     "#0a1018",', 'bg:     "#1a1a1a",'),
    ('border: "#1a2b3c",', 'border: "#2e2e2e",'),
    ('label:  "#2d4f68",', 'label:  "#888888",'),
    ('value:  "#4a7a96",', 'value:  "#f0f0f0",'),
    ('accent: "#cdd9e5",', 'accent: "#d4a843",'),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print("Replaced:", old)
    else:
        print("NOT FOUND:", old)

open("src/components/EmergencyPanel.jsx", "w", encoding="utf-8").write(content)
print("Saved")
