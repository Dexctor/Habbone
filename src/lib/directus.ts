// src/lib/directus.ts
import { createDirectus, rest, readItems, readItem } from '@directus/sdk';

// ---------- ENV ----------
const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL!;
if (!DIRECTUS_URL) throw new Error('NEXT_PUBLIC_DIRECTUS_URL manquant');

// ---------- CLIENT PUBLIC (lecture anonyme / rÃ¨gles rÃ´le Public) ----------
export const directus = createDirectus(DIRECTUS_URL).with(rest());

// ---------- TYPES ----------
export type Dateish = string | number | null | undefined;

export type NewsRecord = {
  id: number;
  titulo?: string | null;
  descricao?: string | null;
  imagem?: string | null;
  noticia?: string | null;
  status?: string | null;
  autor?: string | null;
  data?: Dateish;
};

export type NewsCommentRecord = {
  id: number;
  id_noticia: number;
  comentario?: string | null;
  autor?: string | null;
  data?: Dateish;
  status?: string | null;
};

export type ForumTopicRecord = {
  id: number;
  titulo?: string | null;
  conteudo?: string | null;
  imagem?: string | null;
  autor?: string | null;
  data?: Dateish;
  views?: number | string | null;
  fixo?: boolean | number | string | null;
  fechado?: boolean | number | string | null;
  status?: string | null;
};

export type ForumPostRecord = {
  id: number;
  id_topico: number;
  conteudo?: string | null;
  autor?: string | null;
  data?: Dateish;
  status?: string | null;
};

export type ForumCategoryRecord = {
  id: number | string;
  nome?: string | null;
  descricao?: string | null;
  slug?: string | null;
  ordem?: number | null;
};

export type ForumCommentRecord = {
  id: number;
  id_forum: number;
  comentario?: string | null;
  autor?: string | null;
  data?: Dateish;
  status?: string | null;
};

export type StoryRow = {
  id: number;
  autor?: string | null;
  image?: string | null;
  dta?: Dateish;
  data?: Dateish;
  status?: string | null;
};

type LikeRow = { id_comentario: number | string };

// ===================== NEWS =====================
export function getNews(query?: string): Promise<NewsRecord[]> {
  const q = typeof query === 'string' ? query.trim() : '';
  return directus.request(
    readItems('noticias', {
      fields: ['id', 'titulo', 'descricao', 'imagem', 'noticia', 'status', 'autor', 'data'],
      sort: ['-data'],
      limit: 24,
      ...(q ? { search: q } : {}),
    })
  ) as Promise<NewsRecord[]>;
}

// Admin/list views: larger limits
export function listAllNews(limit = 1000): Promise<NewsRecord[]> {
  return directus.request(
    readItems('noticias', {
      fields: [
        'id',
        'titulo',
        'descricao',
        'imagem',
        // note: for admin list views we include extra fields
        'noticia',
        'status',
        'autor',
        'data',
      ],
      sort: ['-data'],
      limit,
    })
  ) as Promise<NewsRecord[]>;
}

// News by author (nick string)
export function listNewsByAuthor(author: string, limit = 50): Promise<NewsRecord[]> {
  return directus.request(
    readItems('noticias', {
      filter: { autor: { _eq: author } },
      fields: ['id', 'titulo', 'descricao', 'imagem', 'autor', 'data', 'status'],
      sort: ['-data'],
      limit,
    })
  ) as Promise<NewsRecord[]>;
}

export function getOneNews(id: number): Promise<NewsRecord> {
  return directus.request(
    readItem('noticias', id, {
      fields: [
        'id',
        'titulo',
        'descricao',
        'imagem',
        'noticia',
        'autor',
        'data',
        'status',
      ],
    })
  ) as Promise<NewsRecord>;
}

// News for cards (minimal fields only)
export function listNewsForCards(limit = 60): Promise<NewsRecord[]> {
  return directus.request(
    readItems('noticias', {
      fields: ['id', 'titulo', 'descricao', 'imagem', 'data'],
      sort: ['-data'],
      limit,
    })
  ) as Promise<NewsRecord[]>;
}

export function getNewsComments(newsId: number): Promise<NewsCommentRecord[]> {
  return directus.request(
    readItems('noticias_coment', {
      filter: { id_noticia: { _eq: newsId } },
      fields: ['id', 'id_noticia', 'comentario', 'autor', 'data', 'status'],
      sort: ['data'],
      limit: 200,
    })
  ) as Promise<NewsCommentRecord[]>;
}

// ===================== STORIES =====================
import { resolveStoriesTables } from '@/lib/directus/tables';

export async function listStories(limit = 30): Promise<StoryRow[]> {
  for (const col of resolveStoriesTables()) {
    try {
      const rows = await directus.request(
        readItems(col as string, {
          fields: ['id', 'autor', 'image', 'dta', 'data', 'status'],
          sort: ['-dta', '-data'],
          limit,
        })
      ) as StoryRow[];
      if (Array.isArray(rows) && rows.length) return rows;
    } catch {}
  }
  return [] as StoryRow[];
}

export async function getLikesMapForNewsComments(commentIds: number[]): Promise<Record<number, number>> {
  if (!commentIds?.length) return {};
  const likes = await directus.request(
    readItems('noticias_coment_curtidas', {
      filter: { id_comentario: { _in: commentIds } },
      fields: ['id_comentario'],
      limit: 5000,
    })
  ) as LikeRow[];
  return (likes as LikeRow[]).reduce((acc: Record<number, number>, row: LikeRow) => {
    const cid = Number((row as LikeRow).id_comentario);
    acc[cid] = (acc[cid] ?? 0) + 1;
    return acc;
  }, {});
}

// ===================== FORUM =====================
// -- Topics (liste)
export function getTopics(): Promise<ForumTopicRecord[]> {
  return directus.request(
    readItems('forum_topicos', {
      fields: [
        'id',
        'titulo',
        'conteudo',
        'imagem',
        'autor',
        'data',
        'views',
        'fixo',
        'fechado',
        'status',
      ],
      sort: ['-data'],
      limit: 50,
    })
  ) as Promise<ForumTopicRecord[]>;
}

export function listAllTopics(limit = 1000): Promise<ForumTopicRecord[]> {
  return directus.request(
    readItems('forum_topicos', {
      fields: [
        'id',
        'titulo',
        'conteudo',
        'imagem',
        'autor',
        'data',
        'views',
        'fixo',
        'fechado',
        'status',
      ],
      sort: ['-data'],
      limit,
    })
  ) as Promise<ForumTopicRecord[]>;
}

// -- Un topic (dÃ©tail)
export function getOneTopic(id: number): Promise<ForumTopicRecord> {
  return directus.request(
    readItem('forum_topicos', id, {
      fields: [
        'id',
        'titulo',
        'conteudo',
        'imagem',
        'autor',
        'data',
        'views',
        'fixo',
        'fechado',
        'status',
      ],
    })
  ) as Promise<ForumTopicRecord>;
}

// -- Un post
export function getOnePost(id: number): Promise<ForumPostRecord> {
  return directus.request(
    readItem('forum_posts', id, {
      fields: ['id', 'id_topico', 'conteudo', 'autor', 'data', 'status'],
    })
  ) as Promise<ForumPostRecord>;
}

export function listAllPosts(limit = 1000): Promise<ForumPostRecord[]> {
  return directus.request(
    readItems('forum_posts', {
      fields: ['id', 'id_topico', 'conteudo', 'autor', 'data', 'status'],
      sort: ['-data'],
      limit,
    })
  ) as Promise<ForumPostRecord[]>;
}

export function listForumCategories(): Promise<ForumCategoryRecord[]> {
  return directus.request(
    readItems('forum_cat', {
      fields: ['id', 'nome', 'descricao', 'slug', 'ordem'],
      sort: ['ordem', 'nome'],
      limit: 50,
    })
  ) as Promise<ForumCategoryRecord[]>;
}

// -- Commentaires d'un topic
export function getTopicComments(topicId: number): Promise<ForumCommentRecord[]> {
  return directus.request(
    readItems('forum_coment', {
      filter: { id_forum: { _eq: topicId } }, // FK -> forum_topicos.id
      fields: ['id', 'id_forum', 'comentario', 'autor', 'data', 'status'],
      sort: ['data'],
      limit: 500,
    })
  ) as Promise<ForumCommentRecord[]>;
}

// -- Likes des commentaires d'un topic
export async function getLikesMapForTopicComments(commentIds: number[]): Promise<Record<number, number>> {
  if (!commentIds?.length) return {};
  const likes = await directus.request(
    readItems('forum_coment_curtidas', {
      filter: { id_comentario: { _in: commentIds } },
      fields: ['id_comentario'],
      limit: 5000,
    })
  ) as LikeRow[];
  return (likes as LikeRow[]).reduce((acc: Record<number, number>, row: LikeRow) => {
    const cid = Number((row as LikeRow).id_comentario);
    acc[cid] = (acc[cid] ?? 0) + 1;
    return acc;
  }, {});
}

// ---------- MEDIA HELPER ----------
/** RÃsout une URL dâ€™image depuis UUID Directus, URL absolue ou /uploads/... */
export function mediaUrl(idOrPath?: string) {
  if (!idOrPath) return '';

  // a) UUID Directus v4
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      idOrPath
    );
  if (isUUID) return `${DIRECTUS_URL}/assets/${idOrPath}`;

  // b) URL absolue
  if (/^https?:\/\//i.test(idOrPath)) {
    try {
      const u = new URL(idOrPath)
      // Si c'est une URL locale (ex: http://localhost:8055/uploads/...),
      // on rÃ©Ã©crit vers la base legacy publique si configurÃ©e.
      const isLocalhost = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
      const isUploads = u.pathname.startsWith('/uploads/')
      if (isLocalhost && isUploads) {
        const legacy = process.env.NEXT_PUBLIC_LEGACY_MEDIA_BASE || ''
        if (legacy) return `${legacy}${u.pathname}`
      }
    } catch {
      // ignore parsing errors and return as-is
    }
    return idOrPath
  }

  // c) Chemin legacy (ex: /uploads/foo.png ou uploads/foo.png)
  const path = idOrPath.startsWith('/') ? idOrPath : `/${idOrPath}`;
  const base = process.env.NEXT_PUBLIC_LEGACY_MEDIA_BASE || DIRECTUS_URL || '';
  return `${base}${path}`;
}



