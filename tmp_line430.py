from pathlib import Path
lines = Path("src/components/admin/AdminUsersPanel.tsx").read_text().splitlines()
print(lines[429])
