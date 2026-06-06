content = open("src/App.jsx", encoding="utf-8").read()

old = "        })()}\n\n      </main>"
new = "        })()}\n\n        </div>\n\n      </main>"

if old in content:
    content = content.replace(old, new, 1)
    print("Closing div added")
else:
    print("FAILED - showing context around line 3365:")
    lines = content.split("\n")
    for i in range(3362, 3370):
        print(f"{i+1}: {repr(lines[i])}")

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Saved")
