content = open("src/components/Sidebar.jsx", encoding="utf-8").read()

old = """export default function Sidebar({ activeItem, onItemChange, children }) {
  return (
    <div style={{
      width: 260,
      minWidth: 260,
      background: '#111111',
      borderRight: '1px solid #1e1e1e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* Navigation items */}
      <div style={{ padding: '10px 8px 8px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.id}
            item={item}
            active={activeItem === item.id}
            onClick={() => onItemChange(item.id)}
          />
        ))}
      </div>

      {/* Panel content \xe2\x80\x94 scrollable */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}"""

new = """export default function Sidebar({ activeItem, onItemChange, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', flexShrink: 0, height: '100%' }}>

      {/* 48px icon rail */}
      <div style={{
        width: 48,
        background: '#111111',
        borderRight: '1px solid #222222',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        flexShrink: 0,
      }}>
        {NAV_ITEMS.map(item => {
          const active = activeItem === item.id
          const Icon = ICONS[item.id]
          return (
            <button
              key={item.id}
              title={item.label}
              onClick={() => onItemChange(item.id)}
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? 'rgba(212,168,67,0.12)' : 'transparent',
                borderLeft: active ? '2px solid #d4a843' : '2px solid transparent',
                border: 'none',
                borderLeft: active ? '2px solid #d4a843' : '2px solid transparent',
                color: active ? '#d4a843' : '#555555',
                cursor: 'pointer',
                marginBottom: 4,
              }}
            >
              {Icon && <Icon size={18} color={active ? '#d4a843' : '#555555'} />}
            </button>
          )
        })}
      </div>

      {/* Content panel */}
      <div style={{
        width: 212,
        minWidth: 212,
        background: '#111111',
        borderRight: '1px solid #1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        {/* Panel content \xe2\x80\x94 scrollable */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>

    </div>
  )
}"""

if old in content:
    content = content.replace(old, new, 1)
    print("Sidebar rewritten successfully")
else:
    print("FAILED: pattern not found")
    print("Showing last 35 lines for debugging:")
    lines = content.split("\n")
    for i, line in enumerate(lines[-35:], len(lines)-34):
        print(f"{i}: {line}")

open("src/components/Sidebar.jsx", "w", encoding="utf-8").write(content)
print("Saved")
