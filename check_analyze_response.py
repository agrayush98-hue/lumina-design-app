content = open("src/App.jsx", encoding="utf-8").read()

old = "      if (data.error) { showToast(\"Analysis failed: \" + data.error); return }\n      showToast(\"Analysis complete: \" + (data.summary ?? \"Done\"))\n      console.log(\"[floorplan analysis]\", data)"
new = "      if (data.error) { showToast(\"Analysis failed: \" + data.error); return }\n      console.log(\"[floorplan analysis]\", JSON.stringify(data))\n      showToast(\"Analysis complete\")"

if old in content:
    content = content.replace(old, new, 1)
    print("Debug updated")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
