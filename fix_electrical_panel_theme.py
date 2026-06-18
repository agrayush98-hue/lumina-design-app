content = open("src/components/ElectricalPanel.jsx", encoding="utf-8").read()

replacements = [
    ('bg:     "#0a1018",', 'bg:     "#1a1a1a",'),
    ('border: "#1a2b3c",', 'border: "#2e2e2e",'),
    ('label:  "#2d4f68",', 'label:  "#888888",'),
    ('value:  "#4a7a96",', 'value:  "#f0f0f0",'),
    ('accent: "#cdd9e5",', 'accent: "#d4a843",'),
    ('background: "#0d1620", border: `1px solid ${C.border}`,', 'background: "#141414", border: `1px solid ${C.border}`,'),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print("Replaced:", old)
    else:
        print("NOT FOUND:", old)

open("src/components/ElectricalPanel.jsx", "w", encoding="utf-8").write(content)
print("Saved")
