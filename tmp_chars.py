from pathlib import Path
text = Path("src/app/api/admin/users/search/route.ts").read_text(encoding="utf-8")
for idx,ch in enumerate(text):
    if ord(ch) > 126:
        print(idx, repr(ch))
