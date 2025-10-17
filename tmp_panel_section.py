from pathlib import Path
lines = Path("src/components/admin/AdminUsersPanel.tsx").read_text().splitlines()
for idx in range(520, 730):
    print(f"{idx+1}: {lines[idx]}")
