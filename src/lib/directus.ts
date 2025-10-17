// src/lib/directus.ts
import { createDirectus, rest, readItems, readItem } from '@directus/sdk';

// ---------- ENV ----------
const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL!;
if (!DIRECTUS_URL) throw new Error('NEXT_PUBLIC_DIRECTUS_URL manquant');

// ---------- CLIENT PUBLIC (lecture anonyme / rÃ¨gles rÃ´le Public) ----------
export const directus = createDirectus(DIRECTUS_URL).with(rest());

// ===================== NEWS =====================
export function getNews(query?: string) {
  const options: any = {
    fields: [
      'id',
      'titulo',
      'descricao',
      'imagem',
      'noticia',
      'status',
      'autor',
      'data',
    ],
    sort: ['-data'],
    limit: 24,
  };
  const q = typeof query === 'string' ? query.trim() : '';
  if (q) options.search = q;
  return directus.request(readItems('noticias', options));
}

// Admin/list views: larger limits
export function listAllNews(limit = 1000) {
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
  );
}

// News by author (nick string)
export function listNewsByAuthor(author: string, limit = 50) {
  return directus.request(
    readItems('noticias', {
      filter: { autor: { _eq: author } },
      fields: ['id', 'titulo', 'descricao', 'imagem', 'autor', 'data', 'status'],
      sort: ['-data'],
      limit,
    })
  );
}

export function getOneNews(id: number) {
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
  );
}

// News for cards (minimal fields only)
export function listNewsForCards(limit = 60) {
  return directus.request(
    readItems('noticias', {
      fields: ['id', 'titulo', 'descricao', 'imagem', 'data'],
      sort: ['-data'],
      limit,
    })
  );
}

export function getNewsComments(newsId: number) {
  return directus.request(
    readItems('noticias_coment', {
      filter: { id_noticia: { _eq: newsId } },
      fields: ['id', 'id_noticia', 'comentario', 'autor', 'data', 'status'],
      sort: ['data'],
      limit: 200,
    })
  );
}

// ===================== STORIES =====================
export async function listStories(limit = 30) {
  const configured = (process.env.STORIES_TABLE || '').trim();
  const candidates = [
    configured || 'usuarios_storie',
    'usuarios_stories',
    'Usuarios_storie',
    'Usuarios_stories',
  ].filter((v, i, a) => v && a.indexOf(v) === i);
  for (const col of candidates) {
    try {
      const rows = await directus.request(
        readItems(col as any, {
          fields: ['id', 'autor', 'image', 'dta', 'data', 'status'] as any,
          sort: ['-dta', '-data'] as any,
          limit,
        })
      );
      if (Array.isArray(rows) && rows.length) return rows as any[];
    } catch {}
  }
  return [] as any[];
}

export async function getLikesMapForNewsComments(commentIds: number[]) {
  if (!commentIds?.length) return {};
  const likes = await directus.request(
    readItems('noticias_coment_curtidas', {
      filter: { id_comentario: { _in: commentIds } },
      fields: ['id_comentario'],
      limit: 5000,
    })
  );
  return (likes as any[]).reduce((acc: Record<number, number>, row: any) => {
    const cid = Number(row.id_comentario);
    acc[cid] = (acc[cid] ?? 0) + 1;
    return acc;
  }, {});
}

// ===================== FORUM =====================
// -- Topics (liste)
export function getTopics() {
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
  );
}

export function listAllTopics(limit = 1000) {
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
  );
}

// -- Un topic (dÃ©tail)
export function getOneTopic(id: number) {
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
  );
}

// -- Un post
export function getOnePost(id: number) {
  return directus.request(
    readItem('forum_posts', id, {
      fields: ['id', 'id_topico', 'conteudo', 'autor', 'data', 'status'],
    })
  );
}

export function listAllPosts(limit = 1000) {
  return directus.request(
    readItems('forum_posts', {
      fields: ['id', 'id_topico', 'conteudo', 'autor', 'data', 'status'],
      sort: ['-data'],
      limit,
    })
  );
}

export function listForumCategories() {
  return directus.request(
    readItems('forum_cat' as any, {
      fields: ['id', 'nome', 'descricao', 'slug', 'ordem'] as any,
      sort: ['ordem', 'nome'] as any,
      limit: 50 as any,
    } as any)
  );
}

// -- Commentaires d'un topic
export function getTopicComments(topicId: number) {
  return directus.request(
    readItems('forum_coment', {
      filter: { id_forum: { _eq: topicId } }, // FK -> forum_topicos.id
      fields: ['id', 'id_forum', 'comentario', 'autor', 'data', 'status'],
      sort: ['data'],
      limit: 500,
    })
  );
}

// -- Likes des commentaires d'un topic
export async function getLikesMapForTopicComments(commentIds: number[]) {
  if (!commentIds?.length) return {};
  const likes = await directus.request(
    readItems('forum_coment_curtidas', {
      filter: { id_comentario: { _in: commentIds } },
      fields: ['id_comentario'],
      limit: 5000,
    })
  );
  return (likes as any[]).reduce((acc: Record<number, number>, row: any) => {
    const cid = Number(row.id_comentario);
    acc[cid] = (acc[cid] ?? 0) + 1;
    return acc;
  }, {});
}

// ---------- MEDIA HELPER ----------
/** RÃ©sout une URL dâ€™image depuis UUID Directus, URL absolue ou /uploads/... */
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



