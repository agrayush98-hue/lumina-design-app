lines = open("src/components/Sidebar.jsx", encoding="utf-8").readlines()

new_tail = """export default function Sidebar({ activeItem, onItemChange, children }) {
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
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>

    </div>
  )
}
"""

# Replace from line 92 onwards (index 91)
new_content = "".join(lines[:91]) + new_tail
open("src/components/Sidebar.jsx", "w", encoding="utf-8").write(new_content)
print("Done. Total lines:", new_content.count("\n"))
