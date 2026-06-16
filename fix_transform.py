content = open("src/components/DesignCanvas.jsx", encoding="utf-8").read()

# Change the rAF loop to update Konva stage directly instead of React state
old = (
    "      const next = done ? t : { zoom: nz, x: nx, y: ny }\n"
    "      animRef.current = next\n"
    "      setTransform({ ...next })\n"
    "      rafId.current = done ? null : requestAnimationFrame(tick)"
)

new = (
    "      const next = done ? t : { zoom: nz, x: nx, y: ny }\n"
    "      animRef.current = next\n"
    "      // Update Konva stage directly - bypasses React re-render\n"
    "      const stage = stageRef.current\n"
    "      if (stage) { stage.x(next.x); stage.y(next.y); stage.scaleX(next.zoom); stage.scaleY(next.zoom); stage.batchDraw() }\n"
    "      if (done) { setTransform({ ...next }); rafId.current = null }\n"
    "      else { rafId.current = requestAnimationFrame(tick) }"
)

if old in content:
    content = content.replace(old, new, 1)
    print("Transform fix applied")
else:
    print("FAILED")

open("src/components/DesignCanvas.jsx", "w", encoding="utf-8").write(content)
print("Saved")
