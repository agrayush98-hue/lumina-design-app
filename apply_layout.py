# -*- coding: utf-8 -*-
content = open("src/App.jsx", encoding="utf-8").read()

# Change 1: Add rightPanelOpen state after leftSidebarCollapsed
old1 = "const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)"
new1 = "const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)\n  const [rightPanelOpen, setRightPanelOpen] = useState(true)"
if old1 in content:
    content = content.replace(old1, new1)
    print("Change 1 done: rightPanelOpen state added")
else:
    print("Change 1 FAILED: leftSidebarCollapsed not found")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
