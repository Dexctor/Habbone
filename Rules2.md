# Rules2.md — Dossier détaillé du projet

## 1. Vue d’ensemble
- Application Next.js 15 (App Router) pour le fansite HabbOne, couplée à Directus (headless CMS) et aux API publiques Habbo.
- Rend le site public (news, forum, boutique, partenaires) plus des interfaces authentifiées (profil, admin).
- Déploiement cible : Vercel ou VPS (voir `docs/DEPLOYMENT_VPS.md`), frontend statique/SSR + APIs Node.
- Hébergement médias via Directus (`/assets/{uuid}`) ou base legacy (fallback `NEXT_PUBLIC_LEGACY_MEDIA_BASE`).

## 2. Stack & dépendances clés
- Frontend : React 19, Next.js 15.5.2, Tailwind CSS 4 (config tokens), Radix UI / Shadcn (accordions, selects), Framer Motion.
- Auth : NextAuth credentials + JWT ; hashing `bcryptjs`, legacy comparaison MD5.
- Backend services : `@directus/sdk` (REST + service token), `sanitize-html` (à ajouter, Diff 3) pour nettoyer le HTML.
- Outils UI : `lucide-react`, `sonner` pour toasts, `cmdk` pour command palette, `tiptap` pour éditeur riche.
- Validation : `zod` 4.x centralisé dans `src/types/api.ts`.
- Tooling : ESLint 9, Typescript 5, Turbopack (dev/build). CI inexistante à ce jour.

## 3. Config & environnements
- `next.config.ts` (après Diff 1) doit laisser `eslint`/`typescript` actifs (actuellement désactivés).
- `tsconfig.json` : strict true, `moduleResolution: bundler`, alias `@/*`.
- `tailwind.config.ts` : palette HSL basée sur variables CSS, breakpoints legacy (`sm2`, `md2`…).
- `postcss.config.mjs` : plug-in unique `@tailwindcss/postcss`.
- Variables critiques : `NEXT_PUBLIC_DIRECTUS_URL`, `DIRECTUS_SERVICE_TOKEN`, `NEXTAUTH_SECRET`, `ADMIN_NICKS`, `NEXT_PUBLIC_LEGACY_MEDIA_BASE`, `STORIES_TABLE`, `USERS_TABLE`.
- Middleware : `middleware.ts` restreint `/profile` via JWT ; doit s’étendre pour `/profile/admin`.

## 4. Architecture dossiers
- `src/app/` : pages et routes App Router. Ex : `news/[id]/page.tsx` (ISR 60 s), `forum/topic/[id]/page.tsx` (ISR 30 s), `api/verify/*`.
- `src/components/` : UI par domaine (`admin`, `layout`, `news`, `shared`, `ui`). Composants massifs à segmenter (ex : `AdminUsersPanel.tsx` ~800 lignes).
- `src/lib/` : helpers client-safe (Directus public `lib/directus.ts`, Habbo API `lib/habbo.ts`, toasts `lib/sonner.tsx`, verification utils).
- `src/server/` : services server-only (`directus-service.ts`, `authz.ts`, `habbo-cache.ts`). Fait appel aux tokens secrets.
- `src/types/` : Zod + helpers de réponse. Doit centraliser les nouveaux schémas.
- `docs/` : `BADGES.md`, `DEPLOYMENT_VPS.md` (flux VPS + cron).
- `public/img/` : logos GIF animés (legacy) ; attention aux tailles.

## 5. Authentification & autorisations
- Login via `/api/auth/[...nextauth]` utilisant provider Credentials :
  - Cherche utilisateurs par pseudo (`listUsersByNick`), compare aux mots de passe MD5/bcrypt, upgrade transparent si MD5.
  - Rejette comptes bannis (`banido`) ou inactifs (`ativado` ≠ `s`).
  - Complète la session avec rôles Directus (admin_access) ou fallback `ADMIN_NICKS`.
- `assertAdmin()` (`src/server/authz.ts`) :
  - Vérifie session, assert `role === 'admin'`.
  - Cross-check `directusRoleId` / `directusRoleName` contre Directus.
  - Empêche accès si rôle sans `admin_access`.
- Middleware : redirige vers `/login?from=` si token absent.
- TODO P1 : sécuriser journaux (Diff 2) et étendre middleware.

## 6. Endpoints API (App Router)
| Path | Méthode | Description | Validation |
| --- | --- | --- | --- |
| `/api/register` | POST | Création utilisateur + code de vérification, snapshot Habbo | `RegisterBodySchema` |
| `/api/verify/regenerate` | POST | Regénère le code (multi hotel) | `VerificationRegenerateSchema` |
| `/api/verify/status` | POST | Vérifie code (motto Habbo) | `VerificationStatusSchema` |
| `/api/auth/check-user` | GET | Vérifie disponibilité pseudo | `CheckUserQuerySchema` |
| `/api/auth/[...nextauth]` | GET/POST | Routes NextAuth | NextAuth |
| `/api/admin/roles/*` | POST/GET | CRUD rôles (Directus) | `z.object` dans chaque handler |
| `/api/admin/users/search` | POST | Recherche legacy + Directus | `Body` Zod (page/limit) |
| `/api/admin/users/ban` | POST | Banni/suspension | `BodySchema` |
| `/api/admin/users/set-role` | POST | Assigne rôle | `Body` |
| `/api/admin/users/delete` | POST | Supprime | `BodySchema` |
| `/api/stories` | POST | Upload story (Directus Files) | `StoryUploadSchema` (FormData) |
| `/api/news/[id]/comments` | POST | Ajoute commentaire HTML | `BodySchema` (nécessite Diff 3) |
| `/api/habbo/profile` | GET | Agrège profil Habbo + caches | `HabboProfileQuerySchema` |
| `/api/user/moedas` | GET | Renvoie solde | session JWT |

## 7. Flux de données
- Directus `directus-service.ts` :
  - `listUsersByNick`, `getUserByNick`, `createUser`, `updateUserVerification`, `markUserAsVerified`, `uploadFileToDirectus`, etc.
  - Table `usuarios` ; mapping booléens via helpers `asTrue/asFalse`.
  - Stories : fallback multi tables (`usuarios_storie`, `Usuarios_stories`…).
  - Admin bridging : synchronisation legacy via email (`getLegacyUserByEmail`).
- `lib/directus.ts` (client public) : fetch news, forum, stories en lecture.
- Habbo : `lib/habbo.ts` (fetch direct) + `server/habbo-cache.ts` (wrap TTL 6 h/24 h).

## 8. Sécurité & conformité
- Service token Directus utilisé côté serveur uniquement (`staticToken`).
- Nombreux logs contenant données sensibles (codes) → Diff 2 requis.
- JWT NextAuth stocke `directusRoleId`, `directusAdminAccess`; aucune donnée critique (mot de passe).
- Pas de rate-limit → à prévoir (Upstash/Edge).
- Input HTML commentaire non assaini → Diff 3 + `sanitize-html`.
- `next.config.ts` permet images distantes (`images.habbo.com`, `habbone.fr`, `localhost:8055`).
- Cookies/headers par défaut NextAuth ; CSP manquante (à ajouter via middleware).

## 9. Performance & caching
- ISR carte : news (60 s), forum (30 s ou 60 s), boutique (3600 s), profile (no-store).
- Habbo cache en mémoire (Map globale) ; TTL 6 h / 24 h.
- Upload stories : quota 10/mois (`countStoriesThisMonthByAuthor`).
- Admin panel : fetch roles (no-store) + pagination (limit 10). Renders client heavy ; à optimiser via RSC + Suspense (P2).
- Logging intensif (console.info) peut ralentir ; envisager suppression ou logger smarter.

## 10. UI/UX & design system
- Tailwind + variables CSS ; radius contrôlés via `--radius`.
- Layout principal : `src/app/layout.tsx` (metadata, dark theme par défaut, `Providers` + `MotionProvider`).
- Header mélange `HeaderTW`, `Banner`, menus mobile.
- Admin panel : accordions, badges, toggles (Radix). Buttons custom (backgrounds `--bg-*`).
- Accessibilité : radixes fournissent `aria` mais certains éléments (icônes Material) ont `aria-hidden` manquant.
- Problème d’encodage (ISO→UTF8) sur textes FR (ex `description` layout).

## 11. Tooling & dette technique
- ESLint config manquante -> besoin `.eslintrc.js` (P1).
- Scripts npm minimalistes : `lint` sans arguments ; `build` via Turbopack (pas de `typecheck`).
- Pas de tests automatisés ; P2: Vitest pour utilitaires, P3: Playwright.
- Pas de CI (.github/workflows absent) → à créer.
- README par défaut create-next-app (incomplet).

## 12. Roadmap priorisée (résumé P1)
1. Appliquer Diff 2 (suppression logs sensibles) et Diff 3 (assainissement HTML) ; installer `sanitize-html`.
2. Réactiver lint/TS build failure (Diff 1) puis corriger erreurs existantes.
3. Ajouter ESLint config + scripts `lint`, `lint:fix`, `typecheck`.
4. Corriger encodage UTF-8 des contenus FR.
5. Créer workflow GitHub Actions (lint/type/build).
6. Étendre middleware auth (profil/admin) et ajouter logger structuré.

## 13. Références rapides
- Directus docs : https://docs.directus.io
- Habbo API : https://www.habbo.com/api-documentation (non officielle, endpoints publics).
- NextAuth credentials : https://next-auth.js.org/providers/credentials
- Tailwind v4 : https://tailwindcss.com/blog/tailwindcss-v4-alpha
- Sanitization : https://github.com/apostrophecms/sanitize-html

