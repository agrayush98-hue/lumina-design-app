content = open("index.html", encoding="utf-8").read()
if 'name="color-scheme"' not in content:
    old = "<head>"
    new = '<head>\n  <meta name="color-scheme" content="dark">'
    content = content.replace(old, new, 1)
    print("Meta tag added")
else:
    print("Already present")
open("index.html", "w", encoding="utf-8").write(content)
print("Saved")
