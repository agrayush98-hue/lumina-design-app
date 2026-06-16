lines = open(".env", encoding="utf-8").readlines()
# Remove all VITE_APP_SECRET_TOKEN lines
filtered = [l for l in lines if "VITE_APP_SECRET_TOKEN" not in l]
# Add correct one
filtered.append("VITE_APP_SECRET_TOKEN=lumina-secret-2024\n")
open(".env", "w", encoding="utf-8").write("".join(filtered))
print("Done")
