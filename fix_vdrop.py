# -*- coding: utf-8 -*-
content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "toFixed(1)}%" in line and i > 2900 and i < 3000:
        print(f"Line {i}: {repr(line)}")
