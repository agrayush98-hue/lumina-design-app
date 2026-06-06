lines = open('src/components/Dashboard.jsx', encoding='utf-8').readlines()
print(f'Total lines: {len(lines)}')
for i, l in enumerate(lines[:40], 1):
    print(f'{i}: {l}', end='')
