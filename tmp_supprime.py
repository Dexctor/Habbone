from pathlib import Path
path = Path("src/components/admin/AdminUsersPanel.tsx")
text = path.read_text()
text = text.replace("Utilisateur supprimé", "Utilisateur supprime")
text = text.replace("supprim�", "supprime")
path.write_text(text)
