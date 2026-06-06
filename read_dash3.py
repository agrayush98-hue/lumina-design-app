lines = open('src/components/Dashboard.jsx', encoding='utf-8').readlines()
# Show lines 220-280 to see the full shell structure
for i, l in enumerate(lines[219:320], 220):
    print(f'{i}: {l}', end='')
