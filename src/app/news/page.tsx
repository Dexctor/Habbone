import Image from 'next/image';
import Link from 'next/link';
import { Newspaper, Search } from 'lucide-react';
import { getNews, mediaUrl } from '@/lib/directus';

export const revalidate = 60;

function fmtDate(v?: string) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(+d) ? '' : d.toLocaleString();
}

function stripHtml(input: string) {
  return input ? input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function buildExcerpt(record: any) {
  const source = record?.descricao || record?.noticia || '';
  const plain = stripHtml(source);
  if (!plain) return '';
  if (plain.length <= 220) return plain;
  return `${plain.slice(0, 220).trimEnd()}...`;
}

type NewsPageProps = {
  searchParams: Promise<{ q?: string } | undefined> | { q?: string } | undefined;
};

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await Promise.resolve(searchParams);
  const query = typeof params?.q === 'string' ? params.q.trim() : '';
  const rawNews = await getNews(query).catch(() => []);
  const news: any[] = Array.isArray(rawNews)
    ? rawNews
    : Array.isArray((rawNews as any)?.data)
      ? (rawNews as any).data
      : Array.isArray((rawNews as any)?.items)
        ? (rawNews as any).items
        : [];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-md border border-[color:var(--bg-700)]/65 bg-[color:var(--bg-800)]/45 px-6 py-5 shadow-[0_30px_70px_-60px_rgba(0,0,0,0.8)] md:flex md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-[color:var(--bg-700)]/70">
            <Newspaper className="h-6 w-6 text-[color:var(--foreground)]/80" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground)]/55">Explorer</p>
            <h1 className="text-lg font-bold uppercase tracking-[0.32em] text-[color:var(--foreground)]">
              Tous les articles
            </h1>
          </div>
        </div>
        <form className="mt-4 md:mt-0 md:w-80" method="get">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[color:var(--foreground)]/35" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Rechercher un article"
              className="h-11 w-full rounded-sm border border-[color:var(--bg-600)]/60 bg-[color:var(--bg-900)]/55 pl-9 pr-3 text-sm font-medium text-[color:var(--foreground)]/85 placeholder:text-[color:var(--foreground)]/30 focus-visible:border-[color:var(--bg-300)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bg-300)]/25"
            />
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {news.length === 0 ? (
          <div className="rounded-md border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-900)]/40 px-6 py-16 text-center text-sm uppercase tracking-[0.24em] text-[color:var(--foreground)]/45">
            Aucun article trouve
          </div>
        ) : (
          news.map((article: any) => {
            const imageUrl = mediaUrl(article?.imagem);
            const excerpt = buildExcerpt(article);
            const showFade = excerpt.length > 160;
            const authorLabel = stripHtml(article?.autor || '');
            const statusLabel = stripHtml(article?.status || '');
            return (
              <article
                key={article.id}
                className="grid gap-4 rounded-sm border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/45 p-5 shadow-[0_24px_65px_-55px_rgba(0,0,0,0.9)] sm:grid-cols-[minmax(0,170px)_1fr] sm:p-6"
              >
                <div className="relative h-48 overflow-hidden rounded-sm border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-800)]/60 sm:h-44">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={stripHtml(article?.titulo || `Article ${article.id}`)}
                      fill
                      sizes="(max-width: 640px) 100vw, 200px"
                      className="object-cover"
                      priority={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--foreground)]/40">
                      Aucun visuel
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Link
                      href={`/news/${article.id}`}
                      className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)] hover:text-[color:var(--foreground)]/80"
                    >
                      {stripHtml(article?.titulo || `Article #${article.id}`)}
                    </Link>
                    {excerpt ? (
                      <div
                        className="relative overflow-hidden rounded-sm border border-[color:var(--bg-700)]/50 bg-[color:var(--bg-800)]/50 p-3"
                        style={{ maxHeight: '5.5rem' }}
                      >
                        <p className="text-sm leading-relaxed text-[color:var(--foreground)]/75">{excerpt}</p>
                        {showFade ? (
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[color:var(--bg-800)] via-[color:var(--bg-800)]/70 to-transparent" />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--foreground)]/65">
                    <Link
                      href={`/news/${article.id}`}
                      className="inline-flex items-center justify-center rounded-sm bg-[#1d4bff] px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#335bff]"
                    >
                      Voir plus
                    </Link>
                    {authorLabel ? (
                      <span className="rounded-full border border-[color:var(--bg-600)]/60 bg-[color:var(--bg-800)]/55 px-3 py-1 text-[0.6rem] uppercase tracking-[0.22em] text-[color:var(--foreground)]/80">
                        {authorLabel}
                      </span>
                    ) : null}
                    {statusLabel ? (
                      <span className="rounded-full border border-[color:var(--bg-600)]/60 bg-[color:var(--bg-800)]/55 px-3 py-1 text-[0.6rem] uppercase tracking-[0.22em] text-[color:var(--foreground)]/65">
                        {statusLabel}
                      </span>
                    ) : null}
                    <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-[color:var(--foreground)]/45">
                      {fmtDate(article?.data)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
