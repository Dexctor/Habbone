import { mediaUrl } from '@/lib/directus'
import { listStoriesService } from '@/server/directus-service'
import StoriesClient from './stories-client'

export default async function Stories() {
  // Use server-side service token to ensure visibility even if collection isn't public
  const rows = (await listStoriesService(30).catch(() => [])) as any[]
  const items = Array.isArray(rows)
    ? rows
        .map((r: any) => {
          const src = mediaUrl(r.image ?? r.imagem ?? r.Image ?? r.Imagem ?? '')
          const author = String(r.autor ?? r.Autor ?? '') || null
          // Prefer legacy integer UNIX seconds if plausible; otherwise fallback to record creation date
          const raw = (r.data ?? r.dta ?? r.Data ?? null) as any
          const n = Number(raw)
          const isUnixSeconds = Number.isFinite(n) && n >= 1_000_000_000 // >= ~2001-09-09
          const date = isUnixSeconds ? n : (r.date_created ?? null)
          const alt = author ? author : `Story #${r.id ?? ''}`
          return { id: String(r.id ?? ''), src, alt, author, date }
        })
        .filter((x) => x.src)
    : []

  // Ensure chronological order: newest on the left
  const toMs = (v: any): number => {
    if (v == null || v === '') return 0
    if (typeof v === 'number') return v > 1e12 ? v : v * 1000
    const n = Number(v)
    if (!Number.isNaN(n) && n > 0) return n > 1e12 ? n : n * 1000
    const t = Date.parse(String(v))
    return Number.isNaN(t) ? 0 : t
  }
  const sorted = Array.isArray(items)
    ? [...items].sort((a: any, b: any) => {
        const diff = toMs(b.date) - toMs(a.date)
        if (diff !== 0) return diff
        // fallback to id desc if same/unknown date
        return (Number(b.id) || 0) - (Number(a.id) || 0)
      })
    : []

  return (
    <section className="w-full stories mb-8 md:mb-10">
      <div className="bar-default flex items-center justify-between w-full min-h-[50px] mb-[20px]">
        <div className="title flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/photo.png" alt="stories" className="mr-[12px] image-pixelated w-[28px] h-[28px]" />
          <label className="font-bold text-[var(--text-lg)] leading-[22px] text-[var(--text-100)] uppercase [text-shadow:0_1px_2px_var(--text-shadow)]">
            Stories
          </label>
        </div>
      </div>

      {sorted.length > 0 ? (
        <StoriesClient items={sorted as any} />
      ) : (
        <div className="text-sm opacity-70 py-2">Aucune story pour le moment.</div>
      )}
    </section>
  )
}
