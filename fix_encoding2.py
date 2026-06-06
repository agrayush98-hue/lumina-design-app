# -*- coding: utf-8 -*-
content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    for char in line:
        if ord(char) > 127:
            print(f"Line {i} col {line.index(char)}: char={repr(char)} ord={ord(char)}")
            print(f"  Context: {repr(line[max(0,line.index(char)-20):line.index(char)+20])}")
            break
