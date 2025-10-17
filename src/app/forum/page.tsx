import Link from 'next/link'
import FadeIn from '@/components/motion/fade-in'
import { mediaUrl } from '@/lib/directus'
import {
  listForumTopicsWithCategories,
  listForumCategoriesService,
} from '@/server/directus-service'

export const revalidate = 60

type ForumTopic = {
  id: number | string
  titulo?: string | null
  conteudo?: string | null
  imagem?: string | null
  autor?: string | null
  data?: string | null
  views?: number | string | null
  fixo?: boolean | number | string | null
  fechado?: boolean | number | string | null
  status?: string | null
  categoria?: string | number | null
  cat_id?: string | number | null
  likes?: number | string | null
  comments?: number | string | null
}

type ForumCategory = {
  id: number | string
  nome?: string | null
  descricao?: string | null
  slug?: string | null
  ordem?: number | null
  status?: string | null
  imagem?: string | null
}

type Section = {
  category: ForumCategory | null
  topics: ForumTopic[]
}

const FALLBACK_ICON = '/img/forum.png'

function toStringSafe(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  if (value instanceof Date) return value.toISOString()
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeKey(value: unknown): string {
  const normalized = toStringSafe(value)
  if (!normalized) return ''
  return normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function toNumber(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function isInactive(status: string | number | boolean | null | undefined): boolean {
  const key = normalizeKey(status)
  return key === 'inativo' || key === 'inactive'
}

function toTimestamp(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (value instanceof Date) return value.getTime()
  const raw = toStringSafe(value)
  if (!raw) return 0
  const parsed = Date.parse(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDate(value: unknown): string | null {
  const timestamp = toTimestamp(value)
  if (!timestamp) return null
  try {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return new Date(timestamp).toLocaleString()
  }
}

function isFlagEnabled(value: boolean | number | string | null | undefined): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return /^(1|true|yes|y|s|on)$/i.test(value.trim())
  return false
}

function registerSectionKey(map: Map<string, Section>, key: string | number | boolean | null | undefined, section: Section) {
  const normalized = normalizeKey(key)
  if (!normalized || map.has(normalized)) return
  map.set(normalized, section)
}

function sortTopicsForDisplay(list: ForumTopic[]): ForumTopic[] {
  return [...list].sort((a, b) => {
    const pinnedDiff = Number(isFlagEnabled(b.fixo)) - Number(isFlagEnabled(a.fixo))
    if (pinnedDiff !== 0) return pinnedDiff
    const dateDiff = toTimestamp(b.data ?? null) - toTimestamp(a.data ?? null)
    if (dateDiff !== 0) return dateDiff
    return (toNumber(b.id) ?? 0) - (toNumber(a.id) ?? 0)
  })
}

function getCategoryLabel(category: ForumCategory | null): string {
  if (!category) return 'Autres discussions'
  const label = toStringSafe(category.nome ?? null)
  return label || 'Autres discussions'
}

function getCategoryIcon(category: ForumCategory | null): string {
  if (category?.imagem) {
    return mediaUrl(category.imagem)
  }
  return FALLBACK_ICON
}

function buildSections(categories: ForumCategory[], topics: ForumTopic[]): Section[] {
  const sections: Section[] = categories.map((category) => ({ category, topics: [] }))
  const sectionByKey = new Map<string, Section>()

  for (const section of sections) {
    const { category } = section
    registerSectionKey(sectionByKey, category?.id ?? null, section)
    registerSectionKey(sectionByKey, category?.slug ?? null, section)
    registerSectionKey(sectionByKey, category?.nome ?? null, section)
  }

  const fallbackTopics: ForumTopic[] = []

  for (const topic of topics) {
    const candidateKeys: Array<string | number | boolean | null | undefined> = [
      topic.cat_id ?? null,
      topic.categoria ?? null,
    ]

    let matched = false
    for (const key of candidateKeys) {
      const lookup = normalizeKey(key)
      if (lookup && sectionByKey.has(lookup)) {
        sectionByKey.get(lookup)?.topics.push(topic)
        matched = true
        break
      }
    }

    if (!matched) fallbackTopics.push(topic)
  }

  for (const section of sections) {
    section.topics = sortTopicsForDisplay(section.topics)
  }

  const result = [...sections]
  if (fallbackTopics.length) {
    result.push({
      category: null,
      topics: sortTopicsForDisplay(fallbackTopics),
    })
  }

  return result
}

export default async function ForumPage() {
  const [topicsRaw, categoriesRaw] = await Promise.all([
    listForumTopicsWithCategories(200).catch(() => []),
    listForumCategoriesService().catch(() => []),
  ])

  const categories = Array.isArray(categoriesRaw)
    ? (categoriesRaw as ForumCategory[])
        .filter((category) => !isInactive(category.status ?? null))
        .sort((a, b) => {
          const orderA = toNumber(a.ordem ?? null) ?? Number.MAX_SAFE_INTEGER
          const orderB = toNumber(b.ordem ?? null) ?? Number.MAX_SAFE_INTEGER
          if (orderA !== orderB) return orderA - orderB
          const nameA = toStringSafe(a.nome ?? null)
          const nameB = toStringSafe(b.nome ?? null)
          return nameA.localeCompare(nameB, 'fr', { sensitivity: 'accent' })
        })
    : []

  const topics = Array.isArray(topicsRaw) ? (topicsRaw as ForumTopic[]) : []
  const sections = buildSections(categories, topics)

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-md border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/45 px-6 py-6 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.85)]">
        <div className="flex flex-col gap-3 text-[color:var(--foreground)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--foreground)]/60">
              Communaute HabbOne
            </p>
            <h1 className="text-2xl font-bold uppercase tracking-[0.04em]">Forums & discussions</h1>
            <p className="text-sm text-[color:var(--foreground)]/65">
              Partage tes idees, decouvre les creations Wired et discute avec toute la communaute.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="relative w-full sm:w-64">
              <span className="pointer-events-none absolute inset-y-1 left-3 flex items-center text-[color:var(--foreground)]/45">
                <i className="material-icons text-[18px]">search</i>
              </span>
              <input
                type="search"
                placeholder="Rechercher un sujet ici"
                className="w-full rounded-md border border-[color:var(--bg-600)]/60 bg-[color:var(--bg-800)]/60 py-2 pl-9 pr-4 text-xs text-[color:var(--foreground)]/80 placeholder:text-[color:var(--foreground)]/40 focus:border-[color:var(--bg-400)] focus:outline-none focus:ring-1 focus:ring-[color:var(--bg-400)]"
              />
            </label>
            <button className="h-10 rounded-md border border-[color:var(--bg-600)]/60 bg-[color:var(--bg-800)]/60 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--foreground)]/80 transition hover:border-[color:var(--bg-500)]/60 hover:text-[color:var(--foreground)]">
              Toutes les listes
            </button>
          </div>
        </div>
      </header>

      {sections.length === 0 ? (
        <FadeIn className="rounded-md border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/45 px-6 py-10 text-center text-sm text-[color:var(--foreground)]/65 shadow-[0_20px_70px_-55px_rgba(0,0,0,0.8)]">
          Aucun sujet n&apos;est disponible pour le moment. Repasse bientot !
        </FadeIn>
      ) : (
        <>
          {sections.map(({ category, topics: list }) => {
            const label = getCategoryLabel(category)
            const icon = getCategoryIcon(category)
            const description = toStringSafe(category?.descricao ?? null)
            const latestTimestamp = list.reduce((acc, topic) => Math.max(acc, toTimestamp(topic.data ?? null)), 0)
            const latestActivity = formatDate(latestTimestamp || null)
            const sectionKey = category
              ? `category-${normalizeKey(category.id ?? null) || normalizeKey(category.nome ?? null) || 'unknown'}`
              : 'category-fallback'

            return (
          <section key={sectionKey} className="space-y-4">
            <FadeIn className="rounded-md border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/50 px-6 py-5 shadow-[0_20px_70px_-55px_rgba(0,0,0,0.8)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="" className="h-10 w-10 rounded bg-[color:var(--bg-800)]/70 object-cover p-1" />
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]">
                      {label}
                    </h2>
                    {description ? (
                      <p className="text-xs text-[color:var(--foreground)]/60">{description}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs uppercase tracking-[0.08em] text-[color:var(--foreground)]/55 sm:flex-row sm:items-center sm:gap-4">
                  <span>
                    {list.length} {list.length > 1 ? 'sujets' : 'sujet'}
                  </span>
                  {latestActivity ? (
                    <span className="sm:whitespace-nowrap">Derniere activite : {latestActivity}</span>
                  ) : null}
                </div>
              </div>
            </FadeIn>

            <ul className="space-y-3">
              {list.length === 0 ? (
                <li className="rounded-md border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/40 px-6 py-5 text-sm text-[color:var(--foreground)]/60">
                  Aucun sujet pour cette categorie pour le moment.
                </li>
              ) : (
                list.map((topic, index) => {
                  const fallbackId = toStringSafe(topic.id)
                  const title = toStringSafe(topic.titulo ?? null) || (fallbackId ? `Topic #${fallbackId}` : 'Topic')
                  const author = toStringSafe(topic.autor ?? null)
                  const publishedAt = formatDate(topic.data ?? null)
                  const views = toNumber(topic.views ?? null) ?? 0
                  const metaItems = [author, publishedAt, `${views} vues`].filter(Boolean)
                  const pinned = isFlagEnabled(topic.fixo ?? null)
                  const closed = isFlagEnabled(topic.fechado ?? null)
                  const likes = toNumber(topic.likes ?? null) ?? 0
                  const comments = toNumber(topic.comments ?? null) ?? 0
                  const topicIdSegment = fallbackId || `fallback-${index}`
                  const topicHref = fallbackId ? `/forum/topic/${fallbackId}` : '#'
                  const topicKey = `topic-${topicIdSegment}`

                  return (
                    <FadeIn
                      as="li"
                      key={topicKey}
                      className="flex flex-col gap-4 rounded-md border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/40 px-6 py-5 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.75)] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-2 sm:max-w-[65%]">
                        <Link
                          href={topicHref}
                          aria-disabled={!fallbackId}
                          tabIndex={fallbackId ? undefined : -1}
                          className="text-base font-semibold uppercase tracking-[0.04em] text-[color:var(--foreground)] transition hover:text-[color:var(--foreground)]/80"
                        >
                          {title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--foreground)]/55">
                          {metaItems.length ? <span>{metaItems.join(' | ')}</span> : null}
                          {pinned ? (
                            <span className="rounded bg-emerald-400/15 px-2 py-1 text-[0.65rem] font-bold text-emerald-200">
                              Epingle
                            </span>
                          ) : null}
                          {closed ? (
                            <span className="rounded bg-rose-400/15 px-2 py-1 text-[0.65rem] font-bold text-rose-200">
                              Ferme
                            </span>
                          ) : null}
                        </div>
                        {toStringSafe(topic.conteudo ?? null) ? (
                          <div
                            className="prose prose-invert max-w-none text-xs leading-relaxed opacity-90 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: toStringSafe(topic.conteudo ?? null) }}
                          />
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-md border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/50 px-3 py-2 text-xs font-semibold">
                          <span>Likes</span>
                          <span>{likes}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-md border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/50 px-3 py-2 text-xs font-semibold">
                          <span>Commentaires</span>
                          <span>{comments}</span>
                        </div>
                        <Link
                          href={topicHref}
                          aria-disabled={!fallbackId}
                          tabIndex={fallbackId ? undefined : -1}
                          className="rounded-md bg-[#1d4bff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#335bff]"
                        >
                          Voir plus
                        </Link>
                      </div>
                    </FadeIn>
                  )
                })
              )}
            </ul>
          </section>
            )
          })}
        </>
      )}
    </main>
  )
}
