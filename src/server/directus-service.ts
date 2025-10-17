// src/server/directus-service.ts
import 'server-only';

import {
  createDirectus,
  rest,
  readItems,
  readItem,
  createItem,
  updateItem,
  deleteItem,
  staticToken,
} from '@directus/sdk';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { HabboUserCore } from '@/lib/habbo';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const SERVICE_TOKEN = process.env.DIRECTUS_SERVICE_TOKEN!;
export const USERS_TABLE = process.env.USERS_TABLE || 'usuarios';
export const STORIES_TABLE = process.env.STORIES_TABLE || 'usuarios_storie';

if (!DIRECTUS_URL) throw new Error('NEXT_PUBLIC_DIRECTUS_URL manquant');
if (!SERVICE_TOKEN) throw new Error('DIRECTUS_SERVICE_TOKEN manquant');

// ----- Client Directus avec service token (server-only) -----
export const directusService = createDirectus(DIRECTUS_URL)
  .with(staticToken(SERVICE_TOKEN))
  .with(rest());

// ================== Directus (users/roles) admin helpers ==================
export type DirectusUserLite = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  role?: { id: string; name?: string; admin_access?: boolean; app_access?: boolean } | string | null;
};

export type DirectusRoleLite = {
  id: string;
  name: string;
  description?: string | null;
  admin_access?: boolean;
  app_access?: boolean;
};

export async function listRoles(): Promise<DirectusRoleLite[]> {
  const rows = await directusService.request(
    readItems('directus_roles' as any, {
      fields: ['id', 'name', 'description', 'admin_access', 'app_access'] as any,
      sort: ['name'] as any,
    } as any)
  );
  return Array.isArray(rows) ? (rows as any) : [];
}

export async function createRole(role: {
  name: string;
  description?: string | null;
  adminAccess?: boolean;
  appAccess?: boolean;
}): Promise<DirectusRoleLite> {
  const payload: any = {
    name: role.name,
    description: role.description ?? null,
    admin_access: !!role.adminAccess,
    app_access: role.appAccess ?? true,
  };
  return directusService.request(createItem('directus_roles' as any, payload as any)) as any;
}

export async function updateRole(roleId: string, patch: Partial<{
  name: string;
  description: string | null;
  adminAccess: boolean;
  appAccess: boolean;
}>): Promise<DirectusRoleLite> {
  const payload: any = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.adminAccess !== undefined) payload.admin_access = !!patch.adminAccess;
  if (patch.appAccess !== undefined) payload.app_access = !!patch.appAccess;
  return directusService.request(updateItem('directus_roles' as any, roleId as any, payload as any)) as any;
}

export async function getDirectusUserById(userId: string): Promise<DirectusUserLite | null> {
  const row = await directusService
    .request(
      readItem('directus_users' as any, userId as any, {
        fields: ['id', 'email', 'first_name', 'last_name', 'status', 'role.id', 'role.name', 'role.admin_access', 'role.app_access'] as any,
      } as any)
    )
    .catch(() => null as any);
  return (row as any) || null;
}
export async function getRoleById(roleId: string): Promise<DirectusRoleLite | null> {
  const row = await directusService
    .request(
      readItem('directus_roles' as any, roleId as any, {
        fields: ['id', 'name', 'description', 'admin_access', 'app_access'] as any,
      } as any)
    )
    .catch(() => null as any);
  return (row as any) || null;
}

export async function searchUsers(
  q?: string,
  roleId?: string,
  status?: string,
  limit = 20,
  page = 1
): Promise<{ items: DirectusUserLite[]; total: number }> {
  // Items
  const items = (await directusService.request(
    readItems('directus_users' as any, {
      search: q || undefined,
      limit: limit as any,
      page: page as any,
      filter: {
        ...(roleId ? ({ role: { _eq: roleId } } as any) : {}),
        ...(status ? ({ status: { _eq: status } } as any) : {}),
      } as any,
      fields: ['id', 'email', 'first_name', 'last_name', 'status', 'role.id', 'role.name', 'role.admin_access', 'role.app_access'] as any,
      sort: ['email'] as any,
    } as any)
  )) as any[];

  // Total via REST meta=total_count
  const url = new URL(`${DIRECTUS_URL}/items/directus_users`);
  if (q) url.searchParams.set('search', q);
  url.searchParams.set('limit', '0');
  url.searchParams.set('meta', 'total_count');
  if (roleId) url.searchParams.set('filter[role][_eq]', roleId);
  if (status) url.searchParams.set('filter[status][_eq]', status);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
    cache: 'no-store',
  }).catch(() => null as any);
  let total = 0;
  if (res && res.ok) {
    try {
      const json = await res.json();
      total = Number((json as any)?.meta?.total_count ?? 0);
    } catch {}
  }
  return { items: Array.isArray(items) ? (items as any) : [], total: Number.isFinite(total) ? total : 0 };
}

export async function setUserRole(userId: string, roleId: string) {
  return directusService.request(updateItem('directus_users' as any, userId as any, { role: roleId } as any));
}

// Legacy block check by email (usuarios)
export async function getLegacyUserByEmail(email?: string | null) {
  const e = (email || '').trim();
  if (!e) return null as any;
  const rows = await directusService.request(
    readItems(USERS_TABLE as any, {
      filter: { email: { _eq: e } } as any,
      fields: ['id', 'email', 'banido', 'ativado'] as any,
      limit: 1 as any,
    } as any)
  );
  return Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
}
export type LegacyUserLite = {
  id: number | string;
  email?: string | null;
  nick?: string | null;
  status?: string | null;
  role?: string | null;
  banido?: string | number | boolean | null;
  ativado?: string | number | boolean | null;
};

export async function searchLegacyUsuarios(
  q?: string,
  limit = 20,
  page = 1,
  filters?: { roleName?: string | null; status?: string | null }
): Promise<{ items: LegacyUserLite[]; total: number }> {
  // Try via SDK first; if empty, we'll fallback to REST
  try {
    const params: any = {
      limit: limit as any,
      page: page as any,
      fields: ['id', 'email', 'nick', 'status', 'role', 'banido', 'ativado'] as any,
    };
    if (q) params.search = q;
    const filter: Record<string, unknown> = {};
    if (filters?.roleName) filter.role = { _eq: filters.roleName };
    if (filters?.status) filter.status = { _eq: filters.status };
    if (Object.keys(filter).length) params.filter = filter;
    const items = (await directusService.request(readItems(USERS_TABLE as any, params))) as any[];

    if (Array.isArray(items) && items.length > 0) {
      // Total via REST meta
      const url = new URL(`${DIRECTUS_URL}/items/${encodeURIComponent(USERS_TABLE)}`);
      if (q) url.searchParams.set('search', q);
      if (filters?.roleName) url.searchParams.set('filter[role][_eq]', String(filters.roleName));
      if (filters?.status) url.searchParams.set('filter[status][_eq]', String(filters.status));
      url.searchParams.set('limit', '0');
      url.searchParams.set('meta', 'total_count');
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
        cache: 'no-store',
      }).catch(() => null as any);
      let total = 0;
      if (res && res.ok) {
        try {
          const json = await res.json();
          total = Number((json as any)?.meta?.total_count ?? 0);
        } catch {}
      }
      return { items, total: Number.isFinite(total) ? total : items.length };
    }
  } catch {}

  // Fallback via REST (bypasses SDK quirks)
  try {
    const url = new URL(`${DIRECTUS_URL}/items/${encodeURIComponent(USERS_TABLE)}`);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('page', String(page));
    url.searchParams.set('fields', 'id,email,nick,status,role,banido,ativado');
    if (q) url.searchParams.set('search', q);
    if (filters?.roleName) url.searchParams.set('filter[role][_eq]', String(filters.roleName));
    if (filters?.status) url.searchParams.set('filter[status][_eq]', String(filters.status));
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${SERVICE_TOKEN}`, Accept: 'application/json' },
      cache: 'no-store',
    }).catch(() => null as any);
    const json = (await res?.json()?.catch?.(() => null as any)) as any;
    const items = Array.isArray((json as any)?.data) ? (json as any).data : [];

    const totalUrl = new URL(`${DIRECTUS_URL}/items/${encodeURIComponent(USERS_TABLE)}`);
    if (q) totalUrl.searchParams.set('search', q);
    if (filters?.roleName) totalUrl.searchParams.set('filter[role][_eq]', String(filters.roleName));
    if (filters?.status) totalUrl.searchParams.set('filter[status][_eq]', String(filters.status));
    totalUrl.searchParams.set('limit', '0');
    totalUrl.searchParams.set('meta', 'total_count');
    const totalRes = await fetch(totalUrl.toString(), {
      headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
      cache: 'no-store',
    }).catch(() => null as any);
    let total = 0;
    if (totalRes && totalRes.ok) {
      try {
        const totJson = await totalRes.json();
        total = Number((totJson as any)?.meta?.total_count ?? 0);
      } catch {}
    }
    return { items, total: Number.isFinite(total) ? total : items.length };
  } catch {}

  return { items: [], total: 0 };
}

export async function setLegacyUserRole(userId: number | string, roleName: string) {
  return directusService.request(updateItem(USERS_TABLE as any, userId as any, { role: roleName } as any));
}

export async function setDirectusUserStatus(userId: string, status: 'active' | 'suspended') {
  return directusService.request(
    updateItem('directus_users' as any, userId as any, { status } as any),
  );
}

export async function deleteDirectusUser(userId: string) {
  return directusService.request(deleteItem('directus_users' as any, userId as any));
}

export async function setLegacyUserBanStatus(userId: number | string, banned: boolean) {
  const payload: Record<string, unknown> = {
    banido: banned ? 's' : 'n',
    ativado: banned ? 'n' : 's',
    status: banned ? 'suspended' : 'active',
  };
  return directusService.request(updateItem(USERS_TABLE as any, userId as any, payload as any));
}

export async function deleteLegacyUser(userId: number | string) {
  return directusService.request(deleteItem(USERS_TABLE as any, userId as any));
}

export type TeamMember = {
  id: number
  nick: string
  role: string
  joinedAt: string | null
  twitter?: string | null
};

export async function listTeamMembersByRoles(roleNames: string[]): Promise<Record<string, TeamMember[]>> {
  if (!Array.isArray(roleNames) || roleNames.length === 0) return {};

  const normalized = new Map<string, string>();
  const registerKey = (key: string, canonical: string) => {
    const clean = key.trim().toLowerCase();
    if (!clean || normalized.has(clean)) return;
    normalized.set(clean, canonical);
  };
  const stripDiacritics = (value: string) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const result: Record<string, TeamMember[]> = {};
  for (const name of roleNames) {
    const trimmed = (name ?? '').toString().trim();
    if (!trimmed) continue;
    registerKey(trimmed, trimmed);
    registerKey(stripDiacritics(trimmed), trimmed);
    registerKey(trimmed.replace(/\s+/g, ''), trimmed);
    registerKey(stripDiacritics(trimmed.replace(/\s+/g, '')), trimmed);
    if (!/\badmin\b/i.test(trimmed) && !trimmed.toLowerCase().endsWith('s')) {
      registerKey(`${trimmed}s`, trimmed);
      registerKey(stripDiacritics(`${trimmed}s`), trimmed);
    }
    result[trimmed] = [];
  }
  if (normalized.size === 0) return result;

  const rows = (await directusService
    .request(
      readItems(USERS_TABLE as any, {
        filter: {
          role: { _in: Array.from(normalized.values()) } as any,
          banido: { _neq: 's' } as any,
          ativado: { _neq: 'n' } as any,
        } as any,
        limit: 200 as any,
        sort: ['role', 'nick'] as any,
      } as any)
    )
    .catch(() => [])) as any[];

  const ensureString = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));

  for (const raw of Array.isArray(rows) ? rows : []) {
    const roleValueRaw = ensureString(raw?.role).trim();
    const canonicalRole =
      normalized.get(roleValueRaw.toLowerCase()) ||
      normalized.get(stripDiacritics(roleValueRaw).toLowerCase()) ||
      normalized.get(roleValueRaw.replace(/\s+/g, '').toLowerCase()) ||
      normalized.get(stripDiacritics(roleValueRaw.replace(/\s+/g, '')).toLowerCase());
    if (!canonicalRole) continue;

    const nick = ensureString(raw?.nick).trim();
    if (!nick) continue;

    let joined: string | null = null;
    if (typeof raw?.data_criacao === 'string') joined = raw.data_criacao;
    else if (typeof raw?.created_at === 'string') joined = raw.created_at;
    else if (typeof raw?.joined_at === 'string') joined = raw.joined_at;

    const loweredNick = nick.toLowerCase()
    if (loweredNick === 'decrypt') {
      joined = '2022-10-18T11:10:00'
    } else if (loweredNick === '-jiren' || loweredNick === 'jiren') {
      joined = '2023-06-16T10:06:00'
    }

    const twitterRaw =
      typeof raw?.twitter === 'string'
        ? raw.twitter
        : typeof raw?.social_twitter === 'string'
          ? raw.social_twitter
          : typeof raw?.socials === 'object' && raw?.socials && typeof raw.socials.twitter === 'string'
            ? raw.socials.twitter
            : null;

    result[canonicalRole].push({
      id: Number(raw?.id ?? 0) || Math.abs(nick.toLowerCase().split('').reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0)),
      nick,
      role: canonicalRole,
      joinedAt: joined,
      twitter: twitterRaw ? twitterRaw.trim() : null,
    });
  }

  for (const role of Object.keys(result)) {
    result[role] = result[role]
      .sort((a, b) => {
        const dateA = a.joinedAt ? Date.parse(a.joinedAt) : 0;
        const dateB = b.joinedAt ? Date.parse(b.joinedAt) : 0;
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return a.nick.localeCompare(b.nick, 'fr', { sensitivity: 'base' });
      });
  }

  return result;
}

// ================== Helpers password ==================
/** Normalise les hashes bcrypt PHP `$2y$` -> `$2a$` pour bcryptjs */
function normalizeBcrypt(hash?: string) {
  if (!hash) return hash as any;
  return hash.startsWith('$2y$') ? ('$2a$' + hash.slice(4)) : hash;
}

export function isBcrypt(hash?: string) {
  if (!hash) return false;
  const h = normalizeBcrypt(hash);
  return /^\$2[ab]\$/.test(h);
}

export function md5(str: string) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export function hashPassword(plain: string) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plain, salt);
}

export function passwordsMatch(plain: string, stored: string) {
  if (!stored) return false;
  if (isBcrypt(stored)) {
    return bcrypt.compareSync(plain, normalizeBcrypt(stored));
  }
  // fallback MD5 legacy
  return md5(plain) === stored;
}

// ================== Helpers bool 's'/'n' ==================
export function asTrue(v: any) {
  return (
    v === true ||
    v === 1 ||
    v === '1' ||
    v === 's' ||
    v === 'y' ||
    v === 'sim' ||
    v === 'yes' ||
    v === 'ativo' // au cas oÃ¹
  );
}
export function asFalse(v: any) {
  return !asTrue(v);
}

// ================== AccÃ¨s utilisateurs ==================
export async function getUserByNick(nick: string) {
  const rows = await directusService.request(
    readItems(USERS_TABLE, {
      filter: { nick: { _eq: nick } },
      limit: 1,
      fields: [
        'id',
        'nick',
        'senha',
        'email',
        'avatar',
        'missao',
        'ativado',
        'banido',
        'status',
        'role',
        'data_criacao',
      ],
    })
  );
  return Array.isArray(rows) && rows.length ? (rows as any[])[0] : null;
}

export async function createUser(data: {
  nick: string;
  senha: string; // plain
  email?: string | null;
  missao?: string | null;
}) {
  const payload = {
    nick: data.nick,
    senha: hashPassword(data.senha),
    email: data.email ?? null,
    missao: data.missao ?? 'Mission Habbo: HabboOneRegister-0',
    ativado: 's', // dans ta base: 's'/'n'
    banido: 'n',
    data_criacao: new Date().toISOString(),
    // status omis: laisser Directus dÃ©finir la valeur par dÃ©faut si nÃ©cessaire
  };
  return directusService.request(createItem(USERS_TABLE, payload));
}

export async function upgradePasswordToBcrypt(userId: number, plain: string) {
  return directusService.request(
    updateItem(USERS_TABLE, userId, { senha: hashPassword(plain) })
  );
}

// ================== Habbo snapshot cache (best-effort) ==================
/**
 * Tente de stocker un snapshot basique du profil Habbo dans la table utilisateurs.
 * Ne fait rien si les colonnes n'existent pas cÃ´tÃ© Directus (erreur avalÃ©e).
 * Colonnes attendues si vous souhaitez persister ces donnÃ©es:
 *  - habbo_unique_id (string)
 *  - habbo_name (string)
 *  - habbo_core_snapshot (json)
 *  - habbo_snapshot_at (datetime)
 */
export async function tryUpdateHabboSnapshotForUser(
  userId: number,
  core: HabboUserCore
): Promise<boolean> {
  try {
    const payload: any = {
      habbo_unique_id: core.uniqueId,
      habbo_name: core.name,
      habbo_core_snapshot: core,
      habbo_snapshot_at: new Date().toISOString(),
    };
    await directusService.request(updateItem(USERS_TABLE, userId, payload));
    return true;
  } catch {
    // Si les colonnes n'existent pas, on ignore pour ne pas bloquer le flux d'inscription
    return false;
  }
}

// ================== Admin helpers (server-only) ==================
// Users listing (read-only)
export async function adminListUsers(limit = 500) {
  return directusService.request(
    readItems(USERS_TABLE, {
      limit,
      sort: ['-data_criacao'],
      fields: [
        'id',
        'nick',
        'email',
        'ativado',
        'banido',
        'status',
        'data_criacao',
      ],
    })
  );
}

// News (articles)
export async function adminListNews(limit = 500) {
  return directusService.request(
    readItems('noticias', {
      limit,
      sort: ['-data'],
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

export async function adminCreateNews(data: {
  titulo: string;
  descricao?: string | null;
  imagem?: string | null;
  noticia: string;
  autor?: string | null;
  data?: string | null;
  status?: string | null;
}) {
  const payload: any = {
    titulo: data.titulo,
    descricao: data.descricao ?? null,
    imagem: data.imagem ?? null,
    noticia: data.noticia,
    autor: data.autor ?? null,
    data: data.data ?? new Date().toISOString(),
    status: data.status ?? null,
  };
  return directusService.request(createItem('noticias', payload));
}

export async function adminUpdateNews(id: number, patch: Partial<{
  titulo: string;
  descricao: string | null;
  imagem: string | null;
  noticia: string;
  autor: string | null;
  data: string | null;
  status: string | null;
}>) {
  return directusService.request(updateItem('noticias', id, patch as any));
}

export async function adminDeleteNews(id: number) {
  return directusService.request(deleteItem('noticias', id));
}

// Forum (topics, posts)
export async function adminListForumTopics(limit = 200) {
  return directusService.request(
    readItems('forum_topicos', {
      limit,
      filter: { status: { _neq: 'inativo' } } as any,
      sort: ['-data'],
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
        'categoria',
        'cat_id',
      ],
    })
  );
}

export async function listForumTopicsWithCategories(limit = 50) {
  return adminListForumTopics(limit);
}

export async function listForumCategoriesService() {
  return directusService.request(
    readItems('forum_cat' as any, {
      limit: 100 as any,
      sort: ['ordem', 'nome'] as any,
      fields: ['id', 'nome', 'descricao', 'slug', 'ordem', 'status', 'imagem'] as any,
    } as any)
  );
}

export async function adminCreateForumPost(data: {
  id_topico: number;
  conteudo: string;
  autor?: string | null;
  data?: string | null;
  status?: string | null;
}) {
  const payload: any = {
    id_topico: data.id_topico,
    conteudo: data.conteudo,
    autor: data.autor ?? null,
    data: data.data ?? new Date().toISOString(),
    status: data.status ?? null,
  };
  return directusService.request(createItem('forum_posts', payload));
}

export async function adminUpdateForumPost(id: number, patch: Partial<{
  conteudo: string;
  autor: string | null;
  data: string | null;
  status: string | null;
}>) {
  return directusService.request(updateItem('forum_posts', id, patch as any));
}

export async function adminDeleteForumPost(id: number) {
  return directusService.request(deleteItem('forum_posts', id));
}

// ---- Admin: News comments (noticias_coment)
export async function adminListNewsComments(limit = 500, newsId?: number) {
  return directusService.request(
    readItems('noticias_coment', {
      limit,
      sort: ['-data'],
      filter: newsId ? { id_noticia: { _eq: newsId } } : undefined,
      fields: ['id', 'id_noticia', 'comentario', 'autor', 'data', 'status'],
    })
  );
}

export async function adminUpdateNewsComment(
  id: number,
  patch: Partial<{ comentario: string; autor: string | null; data: string | null; status: string | null }>
) {
  return directusService.request(updateItem('noticias_coment', id, patch as any));
}

export async function adminDeleteNewsComment(id: number) {
  return directusService.request(deleteItem('noticias_coment', id));
}

export async function createNewsComment(input: {
  newsId: number;
  author: string;
  content: string;
  status?: string | null;
}) {
  const payload: Record<string, unknown> = {
    id_noticia: input.newsId,
    comentario: input.content,
    autor: input.author || 'Anonyme',
    data: new Date().toISOString(),
    status: input.status ?? 'public',
  };
  return directusService.request(createItem('noticias_coment', payload as any));
}

// ---- Admin: Forum comments (forum_coment)
export async function adminListForumComments(limit = 500, topicId?: number) {
  return directusService.request(
    readItems('forum_coment', {
      limit,
      sort: ['-data'],
      filter: topicId ? { id_forum: { _eq: topicId } } : undefined,
      fields: ['id', 'id_forum', 'comentario', 'autor', 'data', 'status'],
    })
  );
}

export async function adminUpdateForumComment(
  id: number,
  patch: Partial<{ comentario: string; autor: string | null; data: string | null; status: string | null }>
) {
  return directusService.request(updateItem('forum_coment', id, patch as any));
}

export async function adminDeleteForumComment(id: number) {
  return directusService.request(deleteItem('forum_coment', id));
}


// Generic counter using Directus REST (returns meta.total_count)
export async function adminCount(table: string): Promise<number> {
  const url = `${DIRECTUS_URL}/items/${encodeURIComponent(table)}?limit=0&meta=total_count`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
    cache: 'no-store',
  }).catch(() => null as any);
  if (!res || !res.ok) return 0;
  try {
    const json = await res.json();
    const n = Number((json as any)?.meta?.total_count ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function adminCountUsers(): Promise<number> {
  return adminCount(USERS_TABLE);
}

export async function adminUpdateForumTopic(id: number, patch: Partial<{
  titulo: string;
  conteudo: string | null;
  imagem: string | null;
  autor: string | null;
  data: string | null;
  views: number | null;
  fixo: boolean | number | string;
  fechado: boolean | number | string;
  status: string | null;
}>) {
  return directusService.request(updateItem('forum_topicos', id, patch as any));
}

export async function adminDeleteForumTopic(id: number) {
  return directusService.request(deleteItem('forum_topicos', id));
}

export async function getUserMoedas(userId: number): Promise<number> {
  const row = await directusService
    .request(readItem(USERS_TABLE as any, userId as any, { fields: ['moedas'] as any } as any))
    .catch(() => null as any);
  const value = (row as any)?.moedas;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function uploadFileToDirectus(file: File, filename: string, mimeType: string): Promise<{ id: string }> {
  const safeName = filename?.trim() || `story-${Date.now()}`;
  const effectiveMime = mimeType?.trim() || file.type || 'application/octet-stream';
  const formData = new FormData();
  formData.set('file', file, safeName);
  formData.set('title', safeName);

  const response = await fetch(`${DIRECTUS_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_TOKEN}`,
    },
    body: formData,
  }).catch((error: unknown) => {
    throw new Error(
      `UPLOAD_NETWORK_ERROR: ${error instanceof Error ? error.message : String(error)}`
    );
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`UPLOAD_FAILED: ${response.status} ${body}`);
  }

  const json = (await response.json().catch(() => ({}))) as Record<string, any>;
  const data = (json?.data ?? json) as Record<string, any>;
  const id = data?.id ?? null;
  if (!id) throw new Error('UPLOAD_FAILED_NO_ID');
  return { id: String(id) };
}

type StoryRowInput = {
  author: string;
  imageId: string;
  title?: string | null;
  status?: string | null;
};

export async function createStoryRow(input: StoryRowInput) {
  const table = STORIES_TABLE || 'usuarios_storie';
  const nowIso = new Date().toISOString();
  const unixSeconds = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    autor: input.author,
    image: input.imageId,
    imagem: input.imageId,
    image_id: input.imageId,
    status: input.status ?? 'public',
    data: nowIso,
    dta: unixSeconds,
  };
  if (input.title) payload.titulo = input.title;

  try {
    return await directusService.request(createItem(table as any, payload as any));
  } catch {
    const response = await fetch(`${DIRECTUS_URL}/items/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`CREATE_STORY_FAILED: ${response.status} ${body}`);
    }
    const json = (await response.json().catch(() => ({}))) as Record<string, any>;
    return json?.data ?? json;
  }
}

export async function countStoriesThisMonthByAuthor(author: string): Promise<number> {
  if (!author) return 0;
  const table = STORIES_TABLE || 'usuarios_storie';
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startIso = startOfMonth.toISOString();

  const url = new URL(`${DIRECTUS_URL}/items/${encodeURIComponent(table)}`);
  url.searchParams.set('filter[autor][_eq]', author);
  url.searchParams.set('filter[date_created][_gte]', startIso);
  url.searchParams.set('limit', '0');
  url.searchParams.set('meta', 'total_count');

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
    cache: 'no-store',
  }).catch(() => null);

  if (response?.ok) {
    const json = (await response.json().catch(() => null)) as Record<string, any> | null;
    const total = Number(json?.meta?.total_count ?? 0);
    if (Number.isFinite(total) && total >= 0) return total;
  }

  const rows = (await directusService
    .request(
      readItems(table as any, {
        filter: { autor: { _eq: author } } as any,
        limit: 100 as any,
        sort: ['-date_created'] as any,
      } as any)
    )
    .catch(() => [])) as any[];

  if (!Array.isArray(rows)) return 0;
  const startMs = startOfMonth.getTime();
  let count = 0;
  for (const row of rows) {
    const timestamp = extractStoryTimestamp(row);
    if (timestamp >= startMs) count += 1;
    if (count >= 10) break;
  }
  return count;
}

function extractStoryTimestamp(row: any): number {
  if (!row || typeof row !== 'object') return 0;
  const candidates = [
    row?.date_created,
    row?.dateCreated,
    row?.created_at,
    row?.createdAt,
    row?.data,
    row?.dta,
  ];
  for (const candidate of candidates) {
    const ms = normalizeTimestamp(candidate);
    if (ms) return ms;
  }
  return 0;
}

function normalizeTimestamp(value: unknown): number {
  if (!value && value !== 0) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0;
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric > 1e12 ? numeric : numeric * 1000;
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
// ================== Stories (server-only, service token) ==================
export async function listStoriesService(limit = 30): Promise<unknown[]> {
  const candidates = [
    STORIES_TABLE,
    'usuarios_storie',
    'usuarios_stories',
    'Usuarios_Storie',
    'Usuarios_storie',
    'Usuarios Storie',
  ].filter((v, i, a) => v && a.indexOf(v) === i)

  for (const col of candidates) {
    try {
      const rows = await directusService.request(
        readItems(col as any, {
          // Do not specify fields to avoid 400 on unknown field names across installs
          sort: ['-id'] as any,
          limit,
        })
      )
      if (Array.isArray(rows) && rows.length) return rows as any[]
    } catch {}
  }
  return [] as any[]
}

