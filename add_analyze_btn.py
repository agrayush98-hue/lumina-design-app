content = open("src/components/RoomSettingsFloating.jsx", encoding="utf-8").read()

old = '          >{isDrawRoom ? "Drawing Room\xe2\x80\xa6  (click to cancel)" : "Draw Room Boundary"}</button>\n        </>'

new = (
    '          >{isDrawRoom ? "Drawing Room\xe2\x80\xa6  (click to cancel)" : "Draw Room Boundary"}</button>\n'
    '\n'
    '          {/* AI Analyze button */}\n'
    '          <button\n'
    '            onClick={() => onAnalyzeFloorPlan?.(floorPlan)}\n'
    '            style={{\n'
    '              width: "100%", height: 30, marginTop: 6,\n'
    '              background: "rgba(212,168,67,0.08)",\n'
    '              border: "1px solid #d4a843",\n'
    '              borderRadius: 4,\n'
    '              color: "#d4a843",\n'
    '              fontFamily: "IBM Plex Mono", fontSize: 11,\n'
    '              cursor: "pointer", letterSpacing: "0.04em",\n'
    '            }}\n'
    '          >Analyze with AI</button>\n'
    '        </>'
)

if old in content:
    content = content.replace(old, new, 1)
    print("Analyze button added")
else:
    print("FAILED - searching:")
    if "Draw Room Boundary" in content:
        print("Draw Room Boundary found")
    if "Drawing Room" in content:
        print("Drawing Room found")

open("src/components/RoomSettingsFloating.jsx", "w", encoding="utf-8").write(content)
print("Saved")
