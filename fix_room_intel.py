# -*- coding: utf-8 -*-
content = open("src/components/RoomIntelligencePanel.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines[:30], 1):
    print(f"{i}: {line}")
