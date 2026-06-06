# -*- coding: utf-8 -*-
content = open("src/App.jsx", encoding="utf-8").read()

old = "        {/* \xe2\x94\x80\xe2\x94\x80 Right: Inspector Panel"
# Find the line number to confirm
idx = content.find("Right: Inspector Panel")
if idx == -1:
    print("NOT FOUND - trying alternate")
    idx = content.find("Inspector Panel")
print("Found at char index:", idx)
print("Context:", repr(content[idx-20:idx+50]))
