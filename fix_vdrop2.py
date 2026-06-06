# -*- coding: utf-8 -*-
content = open("src/App.jsx", encoding="utf-8").read()
content = content.replace(
    ': "\u00e2\u20ac\u201d"}',
    ': "\u2014"}'
)
open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Done")
