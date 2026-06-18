content = open("src/index.css", encoding="utf-8").read()
if "color-scheme" not in content:
    content = "html { color-scheme: dark; }\n" + content
    print("color-scheme added")
else:
    print("Already present")
open("src/index.css", "w", encoding="utf-8").write(content)
print("Saved")
