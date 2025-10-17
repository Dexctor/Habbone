from pathlib import Path
lines = Path("src/components/admin/AdminUsersPanel.tsx").read_text().splitlines()
for idx, line in enumerate(lines, 1):
    if 360 <= idx <= 420:
        print(f"{idx}: {line}")
