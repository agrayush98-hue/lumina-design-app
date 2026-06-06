# -*- coding: utf-8 -*-
content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")

# Show the exact problematic lines
print("Line 3099:", repr(lines[3098]))
print("Line 3314:", repr(lines[3313]))
