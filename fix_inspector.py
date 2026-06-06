# -*- coding: utf-8 -*-
content = open("src/App.jsx", encoding="utf-8").read()

# Fix inspector width from 240 to 280
content = content.replace(
    "            <div style={{\n              width: 240,\n              background: \"#111111\",\n              borderLeft: \"1px solid #1e1e1e\",\n              overflowY: \"auto\",\n              display: \"flex\",\n              flexDirection: \"column\",\n              flexShrink: 0,\n              fontFamily: \"'Inter', -apple-system, BlinkMacSystemFont, sans-serif\",\n            }}>",
    "            <div style={{\n              width: 280,\n              background: \"#111111\",\n              borderLeft: \"1px solid #222222\",\n              overflowY: \"auto\",\n              display: \"flex\",\n              flexDirection: \"column\",\n              flexShrink: 0,\n              height: \"100%\",\n              fontFamily: \"'Inter', -apple-system, BlinkMacSystemFont, sans-serif\",\n            }}>"
)

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Done")
