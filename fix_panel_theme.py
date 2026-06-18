content = open("src/components/RoomSettingsPanel.jsx", encoding="utf-8").read()

replacements = [
    ('panelBg:     "#0a1018",', 'panelBg:     "#1a1a1a",'),
    ('panelBorder: "#1a2b3c",', 'panelBorder: "#2e2e2e",'),
    ('accent:      "#39c5cf",', 'accent:      "#d4a843",'),
    ('label:       "#4a7a96",', 'label:       "#888888",'),
    ('value:       "#cdd9e5",', 'value:       "#f0f0f0",'),
    ('sub:         "#2d4f68",', 'sub:         "#555555",'),
    ('background: "#111d28",', 'background: "#222222",'),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print("Replaced:", old)
    else:
        print("NOT FOUND:", old)

open("src/components/RoomSettingsPanel.jsx", "w", encoding="utf-8").write(content)
print("Saved")
