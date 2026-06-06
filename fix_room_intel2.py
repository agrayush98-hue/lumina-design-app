# -*- coding: utf-8 -*-
content = open("src/components/RoomIntelligencePanel.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "return" in line or "position" in line.lower() or "fixed" in line.lower() or "absolute" in line.lower():
        print(f"{i}: {line}")
