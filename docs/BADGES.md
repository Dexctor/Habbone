# Badges Habbo – Chargement des images

Objectif: charger 100% des images de badges avec une logique simple et robuste, sans proxy interne.

Sources CDN (lecture publique):
- `https://images.habbo.com/c_images`
- `https://images-eussl.habbo.com/c_images`
- `https://habboo-a.akamaihd.net/c_images`

Stratégie (implémentée dans `src/components/profile/modules/BadgeIcon.tsx`):
- Si l’API Habbo fournit une URL d’image, on l’essaie en premier.
- Sinon, on tente successivement pour le code du badge:
  - `album1584/{CODE}.gif`, puis `album1584/{CODE}.png`
  - dossiers legacy `Badges/{CODE}.{gif|png}` et `badges/{CODE}.{gif|png}`
- Variantes de casse du code:
  - code original
  - `CODE.toUpperCase()`
  - pour `ACH_*`, variante camel-case (ex: `ACH_Tutorial3`)

Notes:
- L’ancienne route `/api/habbo/badge/[code]` a été supprimée; plus de cache négatif ni proxy.
- Aligner l’hôtel sur `.fr` via `HABBO_API_BASE` / `NEXT_PUBLIC_HABBO_BASE` pour cohérence avec l’UI.

