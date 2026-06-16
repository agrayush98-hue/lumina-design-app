lines = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").readlines()

analyze_btn = (
    "\n"
    "          {/* AI Analyze button */}\n"
    "          <button\n"
    "            onClick={() => onAnalyzeFloorPlan?.(floorPlan)}\n"
    "            style={{\n"
    "              width: \"100%\", height: 30, marginTop: 6,\n"
    "              background: \"rgba(212,168,67,0.08)\",\n"
    "              border: \"1px solid #d4a843\",\n"
    "              borderRadius: 4,\n"
    "              color: \"#d4a843\",\n"
    "              fontFamily: \"IBM Plex Mono\", fontSize: 11,\n"
    "              cursor: \"pointer\", letterSpacing: \"0.04em\",\n"
    "            }}\n"
    "          >Analyze with AI</button>\n"
)

# Insert after line 124 (index 123), before line 125 which is </>
new_lines = lines[:124] + [analyze_btn] + lines[124:]
open("src/components/RoomSettingsFloating.jsx", "w", encoding="utf-8").write("".join(new_lines))
print(f"Done. Lines: {len(lines)} -> {len(new_lines)}")
