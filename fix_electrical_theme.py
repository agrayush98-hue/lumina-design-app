content = open("src/components/ElectricalSummary.jsx", encoding="utf-8").read()

replacements = [
    ('bg:      "#0a1018",', 'bg:      "#1a1a1a",'),
    ('bgAlt:   "#0d1520",', 'bgAlt:   "#141414",'),
    ('border:  "#1a2b3c",', 'border:  "#2e2e2e",'),
    ('label:   "#2d4f68",', 'label:   "#888888",'),
    ('value:   "#cdd9e5",', 'value:   "#f0f0f0",'),
    ('dim:     "#4a7a96",', 'dim:     "#555555",'),
    ('accent:  "#39c5cf",', 'accent:  "#d4a843",'),
    ('borderBottom: `1px solid #0b1420`,', 'borderBottom: `1px solid #2e2e2e`,'),
    ('background: "#0b1824",', 'background: "#141414",'),
    ('borderTop: `1px solid #0f2030`,', 'borderTop: `1px solid #2e2e2e`,'),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print("Replaced:", old)
    else:
        print("NOT FOUND:", old)

open("src/components/ElectricalSummary.jsx", "w", encoding="utf-8").write(content)
print("Saved")
