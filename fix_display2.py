# -*- coding: utf-8 -*-
content = open("src/App.jsx", encoding="utf-8").read()

content = content.replace(
    '{luxVal ?? "\u00e2\u20ac\u201d"}',
    '{luxVal ?? "\u2014"}'
)
content = content.replace(
    '`${areaM2.toFixed(1)}m\u00c2\u00b2`',
    '`${areaM2.toFixed(1)}m\u00b2`'
)

open("src/App.jsx", "w", encoding="utf-8").write(content)
print("Done")
