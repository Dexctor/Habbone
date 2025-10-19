import Image from "next/image"
import { MessageCircle } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { PageSection } from "@/components/shared/page-section"
import { Badge } from "@/components/ui/badge"
import {
  getLikesMapForTopicComments,
  getOneTopic,
  getTopicComments,
  mediaUrl,
} from "@/lib/directus"

export const revalidate = 30

type TopicPageProps = {
  params: Promise<{ id: string }> | { id: string }
}

function fmtDateSmart(value?: string | number) {
  if (value == null) return ""
  const numeric = typeof value === "string" ? Number(value) : value
  if (!Number.isFinite(numeric)) return ""
  const millis = numeric < 1_000_000_000_000 ? numeric * 1000 : numeric
  const date = new Date(millis)
  return Number.isNaN(+date) ? "" : date.toLocaleString()
}

function stripHtml(input: string) {
  return input ? input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : ""
}

export default async function TopicPage(props: TopicPageProps) {
  const params =
    typeof props.params === "object" && "then" in (props.params as any)
      ? await (props.params as Promise<{ id: string }>)
      : (props.params as { id: string })

  const topicId = Number(params?.id || 0)

  if (!Number.isFinite(topicId) || topicId <= 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[color:var(--foreground)]/55 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
        Sujet introuvable.
      </main>
    )
  }

  const [topic, commentsRaw] = await Promise.all([
    getOneTopic(topicId).catch(() => null),
    getTopicComments(topicId).catch(() => []),
  ])

  if (!topic) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[color:var(--foreground)]/55 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
        Sujet introuvable.
      </main>
    )
  }

  const comments = Array.isArray(commentsRaw) ? commentsRaw : []
  const commentIds = comments.map((comment: any) => Number(comment.id)).filter(Number.isFinite)
  const likesMap = commentIds.length
    ? await getLikesMapForTopicComments(commentIds)
    : {}

  const title = stripHtml(topic.titulo || `Sujet #${topic.id}`) || `Sujet #${topic.id}`
  const excerpt = stripHtml(topic.conteudo || "")
  const publishedAt = fmtDateSmart(topic.data)
  const author = stripHtml(topic.autor || "")
  const imageUrl = topic.imagem ? mediaUrl(topic.imagem) : null

  const commentsLabel = `${comments.length} commentaire${comments.length > 1 ? "s" : ""}`

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
      <PageHero
        icon={<MessageCircle className="h-6 w-6" />}
        kicker="Forum"
        title={title}
        description={excerpt ? `${excerpt.slice(0, 200)}${excerpt.length > 200 ? "…" : ""}` : undefined}
      >
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
          {author ? (
            <Badge variant="outline">
              Par {author}
            </Badge>
          ) : null}
          {publishedAt ? (
            <Badge variant="outline" className="text-[color:var(--foreground)]/70">
              Publie le {publishedAt}
            </Badge>
          ) : null}
          {topic.fixo ? (
            <Badge variant="secondary">Epingle</Badge>
          ) : null}
          {topic.fechado ? (
            <Badge variant="destructive">Ferme</Badge>
          ) : null}
        </div>
      </PageHero>

      <PageSection contentClassName="space-y-6">
        {imageUrl ? (
          <div className="relative overflow-hidden border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-800)]/60">
            <Image
              src={imageUrl}
              alt=""
              width={1200}
              height={720}
              sizes="(max-width: 768px) 100vw, 800px"
              className="h-full w-full object-cover"
              priority={false}
            />
          </div>
        ) : null}

        {topic.conteudo ? (
          <article
            className="prose prose-invert max-w-none prose-headings:tracking-[0.08em] prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: topic.conteudo }}
          />
        ) : (
          <p className="text-sm text-[color:var(--foreground)]/65">
            Aucun contenu détaillé pour ce sujet.
          </p>
        )}
      </PageSection>

      <PageSection
        title="Commentaires"
        description={commentsLabel}
        contentClassName="space-y-4"
      >
        {comments.length === 0 ? (
          <p className="border border-dashed border-[color:var(--bg-700)]/60 bg-[color:var(--bg-900)]/35 px-5 py-6 text-center text-sm text-[color:var(--foreground)]/60">
            Aucun commentaire pour le moment.
          </p>
        ) : (
          comments.map((comment: any) => {
            const likeCount = likesMap?.[Number(comment.id)] ?? 0
            const commentAuthor = stripHtml(comment.autor || "Anonyme")
            const commentDate = fmtDateSmart(comment.data)

            return (
              <article
                key={comment.id}
                className="space-y-3 border border-[color:var(--bg-700)]/45 bg-[color:var(--bg-900)]/45 px-5 py-4 shadow-[0_18px_45px_-45px_rgba(0,0,0,0.55)]"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]/65">
                  <span className="text-[color:var(--foreground)]">{commentAuthor}</span>
                  {commentDate ? (
                    <>
                      <span className="text-[color:var(--foreground)]/35">•</span>
                      <span className="text-[color:var(--foreground)]/50">{commentDate}</span>
                    </>
                  ) : null}
                  <Badge variant="outline" className="ml-auto text-[color:var(--foreground)]/70">
                    {likeCount} like{likeCount > 1 ? "s" : ""}
                  </Badge>
                </div>
                <div
                  className="prose prose-sm prose-invert max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: comment.comentario || "" }}
                />
              </article>
            )
          })
        )}
      </PageSection>
    </main>
  )
}

