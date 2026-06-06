lines = open('src/components/Dashboard.jsx', encoding='utf-8').readlines()
# Find the return statement
for i, l in enumerate(lines, 1):
    if 'return (' in l and i > 100:
        print(f'Return at line {i}: {l}', end='')
        break
# Show lines around it
for i, l in enumerate(lines[i-2:i+20], i-1):
    print(f'{i}: {l}', end='')
