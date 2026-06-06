import codecs
content = codecs.open("src/App.jsx", "r", "utf-8").read()

toggle_strip = (
    "        {/* Right panel toggle strip */}\n"
    "        <div\n"
    "          onClick={() => setRightPanelOpen(p => !p)}\n"
    "          style={{\n"
    "            width: 16,\n"
    "            background: \"#111111\",\n"
    "            borderLeft: \"1px solid #222222\",\n"
    "            display: \"flex\",\n"
    "            alignItems: \"center\",\n"
    "            justifyContent: \"center\",\n"
    "            cursor: \"pointer\",\n"
    "            flexShrink: 0,\n"
    "            zIndex: 30,\n"
    "          }}\n"
    "        >\n"
    "          <span className=\"material-symbols-outlined\" style={{ fontSize: 14, color: \"#555555\" }}>\n"
    "            {rightPanelOpen ? \"chevron_right\" : \"chevron_left\"}\n"
    "          </span>\n"
    "        </div>\n\n"
    "        <div style={{ width: rightPanelOpen ? \"auto\" : 0, overflow: \"hidden\", display: \"flex\", flexShrink: 0 }}>\n\n"
)

marker = "Right: Inspector Panel"
idx = content.find(marker)
if idx == -1:
    print("MARKER NOT FOUND")
else:
    line_start = content.rfind("\n", 0, idx) + 1
    insert_pos = line_start
    content = content[:insert_pos] + toggle_strip + content[insert_pos:]
    print("Toggle strip inserted at line", content[:insert_pos].count("\n") + 1)

close_old = "        })()}\n\n      </main>"
close_new = "        })()}\n\n        </div>\n\n      </main>"
if close_old in content:
    content = content.replace(close_old, close_new, 1)
    print("Closing wrapper div added")
else:
    print("FAILED: closing pattern not found")

codecs.open("src/App.jsx", "w", "utf-8").write(content)
print("Saved")
