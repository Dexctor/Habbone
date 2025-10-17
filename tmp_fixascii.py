from pathlib import Path
path = Path("src/components/admin/AdminUsersPanel.tsx")
text = path.read_text()
replacements = {
    "R�activer": "Reactiver",
    "mettre � jour": "mettre a jour",
    "r�activ�": "reactive",
    "d�finitivement": "definitivement",
    "supprim�": "supprime"
}
for old, new in replacements.items():
    text = text.replace(old, new)
path.write_text(text)
