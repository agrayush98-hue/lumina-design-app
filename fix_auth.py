content = open('src/components/AuthPage.jsx', encoding='utf-8').read()
broken = 'borderBottom:2px solid  }'
fixed  = 'borderBottom:(active?"2px solid #d4a843":"2px solid transparent")}'
content = content.replace(broken, fixed)
open('src/components/AuthPage.jsx', 'w', encoding='utf-8').write(content)
print('Done')
