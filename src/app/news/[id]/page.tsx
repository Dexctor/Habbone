import Image from "next/image"
import Link from "next/link"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { Newspaper } from "lucide-react"

import { authOptions } from "@/auth"
import NewsCommentForm from "@/components/news/NewsCommentForm"
import { PageHero } from "@/components/shared/page-hero"
import { PageSection } from "@/components/shared/page-section"
import { Badge } from "@/components/ui/badge"
import { getOneNews, getNewsComments, mediaUrl } from "@/lib/directus"
import type { NewsCommentRecord, NewsRecord } from "@/lib/directus"

export const revalidate = 60

type NewsDetailProps = {
  params: Promise<{ id: string }>
}

function fmtDate(value?: string | number | null) {
  if (value == null) return ""
  const v = typeof value === "string" ? value : String(value)
  const date = new Date(v)
  return Number.isNaN(+date) ? "" : date.toLocaleString()
}

function stripHtml(input: string) {
  return input ? input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : ""
}

export default async function NewsDetailPage(props: NewsDetailProps) {
  const { id } = await props.params
  const newsId = Number(id || 0)

  if (!Number.isFinite(newsId) || newsId <= 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[color:var(--foreground)]/55 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
        Article introuvable.
      </main>
    )
  }

  const [newsItem, commentsRaw, session]: [NewsRecord | null, unknown, Session | null] = await Promise.all([
    getOneNews(newsId).catch(() => null),
    getNewsComments(newsId).catch(() => []),
    getServerSession(authOptions),
  ])

  if (!newsItem) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[color:var(--foreground)]/55 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
        Article introuvable.
      </main>
    )
  }

  const comments: NewsCommentRecord[] = Array.isArray(commentsRaw) ? (commentsRaw as NewsCommentRecord[]) : []
  const excerpt = stripHtml(newsItem.descricao || "")
  const title = stripHtml(newsItem.titulo || `Article #${newsItem.id}`) || `Article #${newsItem.id}`
  const publishedAt = fmtDate(newsItem.data)
  const author = stripHtml(newsItem.autor || "")
  const imageUrl = mediaUrl(newsItem.imagem || undefined)
  const isAuthenticated = Boolean(session?.user)

  const commentLabel = `${comments.length} commentaire${comments.length > 1 ? "s" : ""}`

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
      <PageHero
        icon={<Newspaper className="h-6 w-6" />}
        kicker="Actualités"
        title={title}
        description={excerpt || undefined}
      >
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
          <Badge variant="outline">
            {author ? `Par ${author}` : "Auteur inconnu"}
          </Badge>
          {publishedAt ? (
            <Badge variant="outline" className="text-[color:var(--foreground)]/70">
              Publié le {publishedAt}
            </Badge>
          ) : null}
        </div>
      </PageHero>

      <PageSection contentClassName="space-y-6">
        {imageUrl ? (
          <div className="relative overflow-hidden border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-800)]/60">
            <Image
              src={imageUrl}
              alt={title}
              width={1200}
              height={720}
              sizes="(max-width: 768px) 100vw, 800px"
              className="h-full w-full object-cover"
              priority={false}
            />
          </div>
        ) : null}

        <article
          className="prose prose-invert max-w-none prose-headings:tracking-[0.08em] prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: newsItem.noticia || "" }}
        />
      </PageSection>

      <PageSection
        title="Commentaires"
        description={commentLabel}
        actions={
          !isAuthenticated ? (
            <div className="flex flex-col items-end gap-2 text-sm text-[color:var(--foreground)]/70 sm:flex-row sm:items-center sm:gap-3">
              <span>Connecte-toi pour participer.</span>
              <Link
                href={`/login?from=/news/${newsId}`}
                className="inline-flex h-10 items-center justify-center border border-[color:var(--bg-500)]/60 bg-[color:var(--bg-800)]/55 px-4 font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--bg-400)]/70 hover:bg-[color:var(--bg-800)]"
              >
                Connexion
              </Link>
            </div>
          ) : null
        }
        contentClassName="space-y-5"
      >
        {isAuthenticated ? (
          <div className="border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/45 p-4 shadow-[0_18px_55px_-45px_rgba(0,0,0,0.65)]">
            <NewsCommentForm newsId={newsId} />
          </div>
        ) : null}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="border border-dashed border-[color:var(--bg-700)]/60 bg-[color:var(--bg-900)]/35 px-5 py-6 text-center text-sm text-[color:var(--foreground)]/60">
              Aucun commentaire pour le moment.
            </p>
          ) : (
            comments.map((comment: NewsCommentRecord) => (
              <article
                key={comment.id}
                className="space-y-3 border border-[color:var(--bg-700)]/45 bg-[color:var(--bg-900)]/45 px-5 py-4 shadow-[0_18px_45px_-45px_rgba(0,0,0,0.55)]"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]/65">
                  <span className="text-[color:var(--foreground)]">
                    {stripHtml(comment.autor || "Anonyme")}
                  </span>
                  <span className="text-[color:var(--foreground)]/35">•</span>
                  <span className="text-[color:var(--foreground)]/50">
                    {fmtDate(comment.data)}
                  </span>
                </div>
                <div
                  className="prose prose-sm prose-invert max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: comment.comentario || "" }}
                />
              </article>
            ))
          )}
        </div>
      </PageSection>
    </main>
  )
}
