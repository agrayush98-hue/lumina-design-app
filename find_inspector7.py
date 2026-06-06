# -*- coding: utf-8 -*-
content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if i >= 3340 and i <= 3370:
        print(f"{i}: {line}")
