Règles globales de contribution

Stack : Next.js + Directus + NextAuth + Habbo API
Base commune pour assurer cohérence, sécurité et maintenabilité.

📁 1. Architecture
src/
├── app/        # Pages + routes API
├── components/ # UI réutilisable
├── lib/        # Clients publics/utilitaires
├── server/     # Services server-only
└── types/      # Types communs


app/ : pages, routes API (route.ts), ISR explicite. Pas de secrets côté client.

api/* : handlers (Zod, erreurs typées, JSON), appels via server/*.

lib/ : clients publics Directus/Habbo, utilitaires purs.

server/ : services avec tokens, hashing, caches. Toujours server-only.

components/ : UI, use client si besoin, jamais de secrets.

🎯 2. Code

Nommage : fichiers kebab-case, composants/types PascalCase, variables camelCase.

TS : strict, unknown > any, types retour explicites.

Zod : valider toutes entrées, erreurs claires.

Erreurs : pas de throw brut, JSON { error, code? }, logs sans secrets.

🔐 3. Sécurité

NextAuth : credentials only, JWT minimal (uid, nick, role…), page /login.

Flags : interpréter banido/ativado, rejeter comptes bannis/inactifs.

SERVICE_TOKEN : serveur uniquement (directus-service.ts).

Admin : rôle usuarios.role, fallback status/whitelist. Vérif côté serveur + middleware.

🗄️ 4. Directus

Collections : usuarios, noticias, forum_*, snapshot Habbo optionnel.

Index : unicité sur nick, email, habbo_unique_id. Dates + FKs indexés.

Permissions : Public = lecture limitée, Service token = écriture/lecture.

Accès : lecture via lib, écriture via server.

🌐 5. API Habbo

Encapsulation : tout dans lib/habbo.ts.

TTL : core 24h, données lourdes 6h.

Pagination obligatoire, stocker champs utiles.

Rafraîchir snapshot au login (non bloquant).

Hôtel par défaut : .fr, aligner client/serveur.

🚦 6. Next.js

API : /api/register, /api/auth/*, /api/habbo/*. Validation Zod, codes HTTP standards.

Middleware : contrôle d’accès, redirection /login.

ISR : revalidate News (60s), Forum (30–60s).

🖼️ 7. Médias

Priorité UUID Directus, fallback mediaUrl().

Jamais utiliser chemins bruts utilisateur.

⚡ 8. Bonnes pratiques

SWR pour données volatiles, sinon SSR/ISR.

Logs concis sans secrets.

Tests Vitest pour TTL, helpers, auth, handlers.

🔧 9. Env & secrets

Obligatoires : NEXT_PUBLIC_DIRECTUS_URL, DIRECTUS_SERVICE_TOKEN, NEXTAUTH_SECRET.

.env* non commités. Secrets serveur uniquement.

🚀 10. Performance/Accessibilité

next/image, alt descriptifs.

Pas de dangerouslySetInnerHTML sauf contenu sûr.

Requêtes Directus : champs explicites.

🎨 11. UI

Tokens HSL définis dans globals.css, mappés Tailwind/shadcn.

Accessibilité : Radix/shadcn, focus visibles, aria-label.

Header : avatar Habbo, logo, userbar. Images externes whitelistées.

🔄 12. PR

PR petites et ciblées, description claire, tests mis à jour.

Pas de refacto global ni dépendances sans discussion.

👤 13. Profil Habbo

Endpoint /api/habbo/profile.

Retourne user + listes (tolère privé).

Cache interne (no-store côté client).

Page /profile protégée middleware.

Avatar, niveau, motto, compteurs, listes paginées.

Badges : ordre GIF → PNG → album → placeholder.

👨‍💼 14. Admin

Route /profile/admin (role=admin).

UI : accordéons Forum/Articles avec update/suppression inline.

Services Directus serveur-only.

✏️ 15. Éditeur

Tiptap + extensions (placeholder, align, link, image, task-list…).

Full (articles, topics, posts) / simple (commentaires).

Stockage HTML, rendu dangerouslySetInnerHTML (admin).

🔔 16. UX Auth

Toasts via Sonner (lib/sonner.ts).

Connexion/déconnexion/inscription avec retours clairs.

Compatibilité legacy (override alert).

💧 17. Responsive/Hydratation

suppressHydrationWarning si divergence SSR/Client.

Navbar mobile toggle .hide.

Fonts via next/font.

🏅 18. Slider badges

CSS minimal type swiper.

Défilement horizontal + flèches.

📝 19. Journal modifs

Corrections JSX, modals, accessibilité, API moedas, enrichissement profil, bouton admin.