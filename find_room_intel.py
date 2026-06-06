# -*- coding: utf-8 -*-
content = open("src/App.jsx", encoding="utf-8").read()
lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if "RoomIntelligencePanel" in line:
        # Show 5 lines of context
        start = max(0, i-3)
        end = min(len(lines), i+5)
        print(f"\n--- Found at line {i} ---")
        for j in range(start, end):
            print(f"{j+1}: {lines[j]}")
