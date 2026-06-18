content = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").read()

old = (
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

if old in content:
    content = content.replace(old, "", 1)
    print("Analyze button removed")
else:
    print("FAILED")

# Remove prop from FloorPlanSection signature
content = content.replace(", onAnalyzeFloorPlan })", " })")
content = content.replace(", onAnalyzeFloorPlan,\n})", ",\n})")
content = content.replace("\n        onAnalyzeFloorPlan={onAnalyzeFloorPlan}", "")
content = content.replace("  onAnalyzeFloorPlan,\n  embedded,", "  embedded,")

open("src/components/RoomSettingsFloating.jsx", "w", encoding="utf-8").write(content)
print("Saved")
