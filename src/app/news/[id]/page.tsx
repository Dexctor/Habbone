import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Newspaper, MessageCircle } from "lucide-react";
import NewsCommentForm from "@/components/news/NewsCommentForm";
import { authOptions } from "@/auth";
import { getOneNews, getNewsComments, mediaUrl } from "@/lib/directus";

export const revalidate = 60;

type NewsDetailProps = {
  params: Promise<{ id: string }> | { id: string };
};

function fmtDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(+date) ? "" : date.toLocaleString();
}

function stripHtml(input: string) {
  return input ? input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
}

export default async function NewsDetailPage(props: NewsDetailProps) {
  const params = typeof props.params === "object" && "then" in (props.params as any)
    ? await (props.params as Promise<{ id: string }> )
    : (props.params as { id: string });
  const newsId = Number(params?.id || 0);

  if (!Number.isFinite(newsId) || newsId <= 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[color:var(--foreground)]/50">
        Article introuvable.
      </main>
    );
  }

  const [newsItem, commentsRaw, session] = await Promise.all([
    getOneNews(newsId).catch(() => null),
    getNewsComments(newsId).catch(() => []),
    getServerSession(authOptions),
  ]);

  if (!newsItem) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[color:var(--foreground)]/50">
        Article introuvable.
      </main>
    );
  }

  const comments = Array.isArray(commentsRaw) ? commentsRaw : [];
  const excerpt = stripHtml(newsItem.descricao || "");
  const title = stripHtml(newsItem.titulo || `Article #${newsItem.id}`) || `Article #${newsItem.id}`;
  const publishedAt = fmtDate(newsItem.data);
  const author = stripHtml(newsItem.autor || "");
  const imageUrl = mediaUrl(newsItem.imagem);
  const isAuthenticated = Boolean(session?.user);

  return (
    <main className="mx-auto max-w-8xl space-y-10 px-8 py-14 sm:px-14 lg:px-24">
      <article className="overflow-hidden rounded-sm border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-900)]/50 shadow-[0_28px_80px_-55px_rgba(0,0,0,0.8)]">
        <header className="flex items-center gap-4 border-b border-[color:var(--bg-700)]/70 bg-[color:var(--bg-800)]/65 px-7 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[color:var(--bg-700)]/70">
            <Newspaper className="h-6 w-6 text-[color:var(--foreground)]/80" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--foreground)]">{title}</h1>
            {excerpt ? (
              <p className="text-sm text-[color:var(--foreground)]/55">{excerpt}</p>
            ) : null}
          </div>
        </header>

        <div className="space-y-8 px-8 py-8 sm:px-12">
          {imageUrl ? (
            <div className="relative overflow-hidden rounded-sm border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-800)]/60">
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

          <section
            className="prose prose-invert max-w-none prose-headings:tracking-[0.08em] prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: newsItem.noticia || "" }}
          />

          <div className="border-t border-[color:var(--bg-700)]/70 pt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)]/65">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[color:var(--bg-600)]/60 bg-[color:var(--bg-800)]/55 px-3 py-1 text-[0.65rem]">
                {author || "Auteur inconnu"}
              </span>
              {publishedAt ? (
                <span className="text-[0.65rem] text-[color:var(--foreground)]/45">
                  Publie le {publishedAt}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      <section className="rounded-sm border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/45 px-8 py-8 shadow-[0_32px_80px_-45px_rgba(0,0,0,0.75)] sm:px-10">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[color:var(--bg-700)]/70">
              <MessageCircle className="h-6 w-6 text-[color:var(--foreground)]/80" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Commentaires</h2>
              <p className="text-xs text-[color:var(--foreground)]/55">
                {comments.length} commentaire{comments.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {!isAuthenticated && (
            <div className="flex flex-col items-end gap-2 text-sm text-[color:var(--foreground)]/60 sm:flex-row sm:items-center sm:gap-3">
              <span>Connecte-toi pour participer</span>
              <Link
                href={`/login?from=/news/${newsId}`}
                className="inline-flex h-10 items-center justify-center rounded-sm border border-[color:var(--bg-500)]/60 bg-[color:var(--bg-800)]/55 px-4 font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--bg-400)]/70 hover:bg-[color:var(--bg-800)]"
              >
                Connexion
              </Link>
            </div>
          )}
        </header>

        {isAuthenticated ? (
          <div className="mb-6">
            <NewsCommentForm newsId={newsId} />
          </div>
        ) : null}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="rounded-sm border border-[color:var(--bg-700)]/50 bg-[color:var(--bg-800)]/50 px-5 py-6 text-center text-sm text-[color:var(--foreground)]/55">
              Aucun commentaire pour le moment.
            </p>
          ) : (
            comments.map((comment: any) => (
              <div
                key={comment.id}
                className="space-y-3 rounded-md border border-[color:var(--bg-700)]/45 bg-[color:var(--bg-900)]/45 px-5 py-4 shadow-[0_18px_45px_-45px_rgba(0,0,0,0.55)]"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[color:var(--foreground)]/65">
                  <span className="text-[color:var(--foreground)]">{stripHtml(comment.autor || "Anonyme")}</span>
                  <span className="text-[color:var(--foreground)]/35">-</span>
                  <span className="text-[color:var(--foreground)]/45">{fmtDate(comment.data)}</span>
                </div>
                <div
                  className="prose prose-sm prose-invert max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: comment.comentario || "" }}
                />
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}