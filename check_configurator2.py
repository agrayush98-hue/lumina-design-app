lines = open("src/components/FixtureConfigurator.jsx", encoding="utf-8").readlines()
for i in range(0, 50):
    print(f"{i+1}: {lines[i].rstrip()}")
