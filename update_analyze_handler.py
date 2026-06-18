content = open("src/App.jsx", encoding="utf-8").read()

old = (
    "      if (data.error) { showToast(\"Analysis failed: \" + data.error); return }\n"
    "      console.log(\"[floorplan analysis]\", JSON.stringify(data))\n"
    "      setFloorPlanAnalysis(data)\n"
    "      showToast(\"Analysis complete - \" + (data.rooms?.length ?? 0) + \" rooms detected\")"
)

new = (
    "      if (data.error) { showToast(\"Analysis failed: \" + data.error); return }\n"
    "      console.log(\"[floorplan analysis]\", JSON.stringify(data))\n"
    "      setFloorPlanAnalysis(data)\n"
    "      // Auto-draw room boundaries if bounding boxes are available\n"
    "      const fp = activeFloor.floorPlan\n"
    "      if (fp && data.rooms?.length > 0 && data.rooms[0].box) {\n"
    "        const canvasW = 1400\n"
    "        const canvasH = 750\n"
    "        const naturalW = fp.width || canvasW\n"
    "        const naturalH = fp.height || canvasH\n"
    "        const scale = Math.min(canvasW / naturalW, canvasH / naturalH)\n"
    "        const displayW = naturalW * scale\n"
    "        const displayH = naturalH * scale\n"
    "        const imgX = (canvasW - displayW) / 2\n"
    "        const imgY = (canvasH - displayH) / 2\n"
    "        // Draw rooms one by one with a small delay\n"
    "        data.rooms.forEach((room, idx) => {\n"
    "          if (!room.box) return\n"
    "          setTimeout(() => {\n"
    "            const x1 = imgX + (room.box.x1 / 100) * displayW\n"
    "            const y1 = imgY + (room.box.y1 / 100) * displayH\n"
    "            const x2 = imgX + (room.box.x2 / 100) * displayW\n"
    "            const y2 = imgY + (room.box.y2 / 100) * displayH\n"
    "            const drawnWidthPx  = x2 - x1\n"
    "            const drawnHeightPx = y2 - y1\n"
    "            if (drawnWidthPx < 10 || drawnHeightPx < 10) return\n"
    "            handleRoomBoundSet({\n"
    "              x1, y1,\n"
    "              widthM:  room.widthM  || 3,\n"
    "              heightM: room.heightM || 3,\n"
    "              drawnWidthPx,\n"
    "              drawnHeightPx,\n"
    "              name: room.name,\n"
    "            })\n"
    "          }, idx * 100)\n"
    "        })\n"
    "        showToast(\"Drawing \" + data.rooms.length + \" rooms on canvas...\")\n"
    "      } else {\n"
    "        showToast(\"Analysis complete - \" + (data.rooms?.length ?? 0) + \" rooms detected\")\n"
    "      }"
)

if old in content:
    content = content.replace(old, new, 1)
    print("Handler updated")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
