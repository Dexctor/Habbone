# RULES.md

## 1. Portée & objectifs
- Gérer un fansite Next.js 15 (App Router) adossé à Directus et aux API Habbo ; garantir sécurité, cohérence éditoriale et disponibilité.
- Priorité P0 : empêcher fuite de secrets (tokens Directus, codes de vérification) et garantir que les builds échouent si lint/TS cassent (voir Diff 1 & Diff 2).
- Priorité P1 : expérience editors/admins fluide (panel utilisateurs, stories) sans casser la base legacy ; chaque changement doit préserver la compatibilité avec les tables existantes.
- Done when : CI `lint + build` passe, endpoints critiques (`/api/register`, `/api/verify/*`, `/api/admin/*`) testés manuellement ou via scripts, aucune donnée sensible dans les logs applicatifs.

## 2. Structure & nommage
- Répertoire racine `src/` structuré par domaine : `app/` (pages/routes), `components/`, `lib/` (clients publics), `server/` (services server-only), `types/`, `styles/`.
- Imports relatives bannis ; utiliser l’alias `@/*` déclaré dans `tsconfig.json`.
- Fichiers React client : suffixe `.tsx` et directive `'use client'` unique en tête.
- Pages dynamiques : type `PageProps = { params: { id: string } }`, pas de promesse dans `params`.
- Route handlers sous `src/app/api/**` : fichier `route.ts` regroupant toutes les méthodes HTTP.
- Done when : lint custom rule (ESLint `no-restricted-imports`) rejette chemins relatifs sortant du dossier courant ; review structure valide.

## 3. Code style (TS/React/Tailwind)
- TypeScript strict (déjà activé) : aucun `any` implicite ; préférer `unknown`.
- Hooks et composants doivent retourner des valeurs typées explicitement ; réussir `npm run lint`.
- Utiliser Tailwind 4 + tokens CSS : couleurs via variables `--bg-*`, `--foreground` ; créer éventuelles classes utilitaires via `tailwind.config.ts`.
- JSX : composants `PascalCase`, utilitaires `camelCase`, constantes SCREAMING_SNAKE_CASE.
- Ne jamais mélanger CSS legacy inline (`style=`) et Tailwind sur les nouveaux composants.
- Done when : ESLint (`eslint-config-next` + règles custom) passe, aucun avertissement `any`.

## 4. UI/UX (design tokens, composants, a11y, SEO)
- Définir palette et radius dans Tailwind (voir `tailwind.config.ts`) ; les documenter dans `docs/theme.md` (P2).
- Utiliser les primitives Radix/Shadcn existantes ; factoriser boutons/Select dans `src/components/ui`.
- Accessibilité : chaque interaction a `aria-*` pertinents, focus visible, icônes décoratives `aria-hidden`.
- Mettre à jour `metadata` dans `src/app/layout.tsx` pour corriger encodage (UTF-8) et enrichir OpenGraph (P1 checklist).
- Images : préférer `next/image` avec `sizes` adaptées, alt descriptifs ; ne laisser `dangerouslySetInnerHTML` que pour contenu modéré et passé dans `sanitize-html` (voir Diff 3).
- Done when : audit Lighthouse a11y ≥ 90 sur pages principales.

## 5. API & validation (schémas, erreurs, contrats)
- Toutes entrées API validées via Zod (`src/types/api.ts`) ; enrichir de nouveaux schémas au même endroit.
- Réponses standard : `NextResponse.json({ ok: true, data? })` ou `buildError(message, { code, fields? })`.
- Pas de champs sensibles dans les réponses (hash, service token, code de vérification). Logs redacted selon Diff 2.
- Codes HTTP : 2xx succès, 4xx validation/auth, 5xx pour erreurs inattendues ; pas de 200 avec `error`.
- Ajouter helper `respond` commun dans `src/server/http.ts` (P2) pour uniformiser.
- Done when : revue endpoints via tableau (Étape 3) et tests Postman confirment statut + payload attendu.

## 6. Auth & sécurité (rôles, middleware, headers, rate-limit)
- Auth NextAuth credentials (voir `src/auth.ts`) : migrant MD5→bcrypt, rejeter `banido` ou `ativado !== 's'`.
- Rôles : `session.user.role` ∈ {`admin`,`member`}; admin calculé via Directus + fallback `ADMIN_NICKS`. Toute route admin appelle `assertAdmin`.
- Middleware (`middleware.ts`) protège `/profile` et `/profile/*` ; étendre aux routes `/profile/admin` et `/admin` (P1).
- Mettre les en-têtes sécurité par défaut : `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security` via middleware custom (P2).
- Implémenter rate-limit (Edge KV/Upstash) pour `/api/register`, `/api/verify/*`, `/api/news/*` en P2.
- Done when : tests manuels confirment redirection vers `/login` sans session, et logins admin sont les seuls à accéder aux endpoints critiques.

## 7. Données & intégrations (adapters, conventions, erreurs)
- `src/server/directus-service.ts` exclusivement server-only (annoter `'server-only'` déjà présent). Aucun import côté client.
- Toujours passer par fonctions `normalizeHotelCode`, `hashPassword`, `updateUserVerification` pour éviter duplications.
- Créer adaptateurs `mapDirectusUser`, `mapLegacyUser` (P2) pour supprimer `any` et centraliser transformation.
- Table `usuarios` : s’attendre à colonnes `habbo_*`, `missao`, `banido` ; validation de la présence via migrations Directus.
- API Habbo : appeler via `src/server/habbo-cache.ts` (cache 6h) ; ne pas fetcher directement dans les composants.
- Done when : import directus legacy isolé ; aucun fetch cross-domain hors `lib/` ou `server/`.

## 8. Performance (budgets, caching, RSC/ISR)
- App Router : privilégier Server Components pour les pages si pas d’état local lourd (`stories`, `forum` déjà côté serveur).
- `revalidate` explicite dans chaque page ; documenter raisons (news 60s, forum 30s, boutique 3600s).
- API qui touchent Directus doivent définir `cache: 'no-store'` ou `revalidateTag` selon besoin.
- Utiliser `next/image` et `loading="lazy"` pour assets statiques ; éviter GIF lourds hors `public/img`.
- Planifier instrumentation `app/metrics` (P3) pour suivre temps d’appel Directus/Habbo.
- Done when : `npm run build` ne déclenche aucun avertissement RSC, et profil complet Lighthouse montre TTFB < 2s sur news/forum.

## 9. Tests & CI/CD (seuils, workflows, preview)
- Scripts npm à enrichir : `lint`, `lint:fix`, `typecheck`, `test`, `build`. `lint` doit pointer sur `eslint .`.
- CI GitHub Actions (P1) : job `ci.yml` (node 20) exécutant `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`.
- Tests recommandés : Vitest pour helpers (`verification.ts`, `directus-service` adaptation), Playwright smoke (P3).
- Toute PR >20 fichiers nécessite plan test dans description.
- Done when : workflow actif, PR refuse merge si `lint` ou `build` échouent.

## 10. Observabilité (logs structurés, métriques, traces)
- Remplacer `console.*` bruts par `src/server/logger.ts` (P2) centralisant `info/warn/error` avec redaction.
- Logs jamais d’informations secrètes (codes, tokens, mots de passe) – enforcement via Diff 2.
- Ajouter traçage simple (p. ex. `x-request-id` dans headers) pour API critiques.
- Collecter métriques minimalistes : `stories.upload.success`, `auth.login.failed`, `verification.locked`.
- Done when : logs Next/Vercel ne montrent aucun secret en clair, et instrumentation accessible via logger commun.

## 11. Versionning & dépendances (MAJ, Renovate/Dependabot)
- Suivi Next.js 15.x : valider changelog avant upgrade.
- Ajouter Renovate ou Dependabot (P2) pour packages npm (y compris `@directus/sdk`, `next-auth`, `sanitize-html`).
- Verrouiller versions critiques (Next, React, Directus) en caret contrôlé ; pas de `latest`.
- Vérifier licences des libs UI (Radix/Shadcn) avant ajout.
- Done when : config Renovate/Dependabot en place et première PR de mise à jour revue.

## 12. Annexes (glossaire, ADRs)
- Maintenir `docs/DEPLOYMENT_VPS.md` et y lier les règles ci-dessus.
- Ajouter `docs/glossaire.md` listant termes Habbo/Directus (P3).
- Toute décision structurante (ex. migration legacy → Directus) documentée via ADR succinct (`docs/adr-*.md`).
- Done when : docs référencées depuis README et tenues à jour à chaque livraison majeure.

