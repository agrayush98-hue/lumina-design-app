content = open("src/App.jsx", encoding="utf-8").read()

old = "    } catch(e) {\n      showToast(\"Analysis failed\")\n    }\n  }"
new = "    } catch(e) {\n      console.error(\"[analyze catch error]\", e)\n      showToast(\"Analysis failed: \" + e.message)\n    }\n  }"

if old in content:
    content = content.replace(old, new, 1)
    print("Catch debug added")
else:
    print("FAILED")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
