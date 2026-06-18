content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

old = (
    "            })()}\n"
    "\n"
    "            {/* ALL room boundaries"
)

new = (
    "            })()}\n"
    "\n"
    "            {/* AI-detected room boxes overlay */}\n"
    "            {floorPlanImg && (floorPlanAnalysis?.rooms ?? []).some(r => r.box) && (() => {\n"
    "              const fp = floorPlanDisplayRef.current\n"
    "              if (!fp) return null\n"
    "              const colors = [\"#d4a843\", \"#52c4e0\", \"#e05292\", \"#7fd452\", \"#a352e0\", \"#e08a52\", \"#52e0c4\", \"#e052e0\"]\n"
    "              return (\n"
    "                <Group listening={false}>\n"
    "                  {floorPlanAnalysis.rooms.map((room, idx) => {\n"
    "                    if (!room.box) return null\n"
    "                    const color = colors[idx % colors.length]\n"
    "                    const bx = fp.imgX + (room.box.x1 / 100) * fp.displayW\n"
    "                    const by = fp.imgY + (room.box.y1 / 100) * fp.displayH\n"
    "                    const bw = ((room.box.x2 - room.box.x1) / 100) * fp.displayW\n"
    "                    const bh = ((room.box.y2 - room.box.y1) / 100) * fp.displayH\n"
    "                    return (\n"
    "                      <Group key={idx}>\n"
    "                        <Rect x={bx} y={by} width={bw} height={bh} stroke={color} strokeWidth={2} fill={color} opacity={1} fillOpacity={0.12} dash={[6, 4]} />\n"
    "                        <Text x={bx + 4} y={by + 4} text={room.name} fontSize={11} fontFamily=\"IBM Plex Mono\" fill={color} />\n"
    "                      </Group>\n"
    "                    )\n"
    "                  })}\n"
    "                </Group>\n"
    "              )\n"
    "            })()}\n"
    "\n"
    "            {/* ALL room boundaries"
)

if old in content:
    content = content.replace(old, new, 1)
    print("Overlay added")
else:
    print("FAILED")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
