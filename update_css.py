css = open("src/components/Dashboard.css", encoding="utf-8").read()

# Update color tokens only - keep all class names and structure intact
replacements = [
    # Background colors
    ("background: #000000;", "background: #131313;"),
    ("background: #080808;", "background: #0e0e0e;"),
    ("background: #0d0d0d;", "background: #111111;"),
    ("background: #111111;", "background: #111111;"),
    ("background: #0a0a0a;", "background: #0e0e0e;"),
    # Border colors
    ("border-bottom: 1px solid #1a1a1a;", "border-bottom: 1px solid #222222;"),
    ("border-right: 1px solid #1a1a1a;", "border-right: 1px solid #222222;"),
    ("border: 1px solid #1a1a1a;", "border: 1px solid #222222;"),
    ("border: 1px solid #333333;", "border: 1px solid #2a2a2a;"),
    # Header height
    ("height: 58px;", "height: 48px;"),
    # Font
    ("font-family: 'IBM Plex Mono', monospace;", "font-family: 'Inter', -apple-system, sans-serif;"),
    # Sidebar width
    ("width: 220px;", "width: 240px;"),
    # Logo colors
    ("color: #f0f0f0; letter-spacing: 0.1em; }", "color: #f2c35b; letter-spacing: 0.08em; font-weight: 700; }"),
    ("color: #d4a843; letter-spacing: 0.1em; }", "color: #cccccc; letter-spacing: 0.08em; }"),
    # Font sizes - reduce from 16px/17px labels to 12px
    ("font-size: 16px;\n  color: #555555;", "font-size: 12px;\n  color: #888888;"),
    ("font-size: 16px;\n  letter-spacing: 0.08em;", "font-size: 11px;\n  letter-spacing: 0.08em;"),
    ("font-size: 15px;", "font-size: 11px;"),
]

for old, new in replacements:
    if old in css:
        css = css.replace(old, new)
        print(f"Replaced: {old[:50]}")
    else:
        print(f"NOT FOUND: {old[:50]}")

open("src/components/Dashboard.css", "w", encoding="utf-8").write(css)
print("Done")
