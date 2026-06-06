content = open("src/App.jsx", encoding="utf-8").read()

old = '      <main style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>'

new = (
    '      <main style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>\n'
    '\n'
    '        {/* 48px icon rail */}\n'
    '        <div style={{ width: 48, background: "#111111", borderRight: "1px solid #222222", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, flexShrink: 0, zIndex: 40 }}>\n'
    '          {[\n'
    '            { icon: "layers", view: "floor-plan", title: "Floor Plan" },\n'
    '            { icon: "lightbulb", view: "luminaires", title: "Luminaires" },\n'
    '            { icon: "calculate", view: "calculation", title: "Calculation" },\n'
    '            { icon: "settings_input_component", view: "dali", title: "DALI Bus" },\n'
    '            { icon: "list_alt", view: "reports", title: "Reports" },\n'
    '          ].map(item => (\n'
    '            <button\n'
    '              key={item.view}\n'
    '              title={item.title}\n'
    '              onClick={() => handleSidebarChange(item.view)}\n'
    '              style={{\n'
    '                width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",\n'
    '                background: sidebarView === item.view ? "rgba(212,168,67,0.12)" : "transparent",\n'
    '                borderLeft: sidebarView === item.view ? "2px solid #d4a843" : "2px solid transparent",\n'
    '                color: sidebarView === item.view ? "#d4a843" : "#555555",\n'
    '                cursor: "pointer", border: "none", marginBottom: 4,\n'
    '              }}\n'
    '            >\n'
    '              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>\n'
    '            </button>\n'
    '          ))}\n'
    '        </div>\n'
)

if old in content:
    content = content.replace(old, new, 1)
    print("Change 3 done: icon rail added")
else:
    print("FAILED: main tag not found")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
