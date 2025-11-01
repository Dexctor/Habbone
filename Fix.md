
# Fix log

## 2025-10-22

- **[TopBar hooks fix]** `src/components/layout/header/TopBar.tsx`
  - Refactor to respect `react-hooks/rules-of-hooks` by splitting conditional submenu logic into `TopLevelItemWithChildren` (hooks are now always called at top-level of that component).
  - Typed `fast?: Transition` (Framer Motion) instead of `any` and removed `as any` on `transition`.
  - Narrowed global `Play` signature to `Play(v?: number)`.

- **[useId fix]** `src/components/shared/text-input.tsx`
  - Resolved conditional hook usage by calling `useId()` unconditionally (`autoId`), then `const inputId = id ?? autoId`.
  - Reduced `any` by splitting props into `InputOnlyProps | TextareaOnlyProps` with a shared variant type; removed `(props as any)` spreads.

- **[Reduce any in motion]** `src/components/motion/fade-in.tsx`
  - Replaced `any` with typed generics and `Record<string, unknown>` for motion component, kept Framer types compatible.
  - Ensured `ease` type compatibility by casting readonly tuple safely.

- **[Motion provider typing]** `src/components/motion/motion-provider.tsx`
  - Removed `as any` casts. Transition now typed with `Partial<Transition>` and tuple `ease` casted safely.

- **[Forum topic page typing]** `src/app/forum/topic/[id]/page.tsx`
  - Introduced `ForumTopicRecord` and `ForumCommentRecord` usages to remove `any`.
  - `fmtDateSmart` accepts `string | number | null` to match data shapes.
  - Typed comments array and map callbacks.

- **[Reduce any at source]** `src/lib/directus.ts`
  - Added domain types: `NewsRecord`, `NewsCommentRecord`, `ForumTopicRecord`, `ForumPostRecord`, `ForumCommentRecord`, `ForumCategoryRecord`, `StoryRow`.
  - Removed Directus generics that caused schema arity/type explosion; set explicit function return types with safe casts to typed records/arrays.
  - No logic change to queries (collections/fields/filters remain the same).

- **[Reduce any at source]** `src/lib/habbo.ts`
  - Introduced typed interfaces for profile/friends/groups/rooms/badges/achievements.
  - Replaced `any`/`any[]` return types with explicit typed arrays and objects.
  - Kept fetch helper and endpoints unchanged.

