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
import { resolveStoriesTables } from '@/lib/directus/tables';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const SERVICE_TOKEN = process.env.DIRECTUS_SERVICE_TOKEN!;
export const USERS_TABLE = process.env.USERS_TABLE || 'usuarios';
export const STORIES_TABLE = process.env.STORIES_TABLE || 'usuarios_storie';
const STORIES_FOLDER_ID = (process.env.DIRECTUS_FILES_FOLDER || '').trim() || null;

if (!DIRECTUS_URL) throw new Error('NEXT_PUBLIC_DIRECTUS_URL manquant');
if (!SERVICE_TOKEN) throw new Error('DIRECTUS_SERVICE_TOKEN manquant');

export type HabboVerificationStatus = 'pending' | 'ok' | 'failed' | 'locked';

// ----- Client Directus avec service token (server-only) -----
export const directusService = createDirectus<DirectusCmsSchema>(DIRECTUS_URL)
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
 

type DirectusCmsSchema = {
  directus_roles: DirectusRoleLite;
  directus_users: DirectusUserLite;
} & Record<string, unknown>;

type CollectionResponse<T> = {
  data?: T[];
  meta?: { total_count?: number };
};

type DirectusRolePayload = {
  name: string;
  description: string | null;
  admin_access: boolean;
  app_access: boolean;
};
 
const rItems = readItems as any;
const rItem = readItem as any;
const cItem = createItem as any;
const uItem = updateItem as any;
const dItem = deleteItem as any;

export async function listRoles(): Promise<DirectusRoleLite[]> {
  const rows = await directusService.request(
    rItems('directus_roles', {
      fields: ['id', 'name', 'description', 'admin_access', 'app_access'] as any,
      sort: ['name'] as any,
    } as any)
  ).catch(() => []);
  return Array.isArray(rows) ? (rows as DirectusRoleLite[]) : [];
}

export type CreateRoleInput = {
  name: string;
  description?: string | null;
  adminAccess?: boolean;
  appAccess?: boolean;
};

export async function createRole(role: CreateRoleInput): Promise<DirectusRoleLite> {
  const payload: DirectusRolePayload = {
    name: role.name,
    description: role.description ?? null,
    admin_access: role.adminAccess ?? false,
    app_access: role.appAccess ?? true,
  };
  const created = await directusService.request(
    cItem('directus_roles', payload as any)
  );
  return created as DirectusRoleLite;
}

export type UpdateRoleInput = Partial<{
  name: string;
  description: string | null;
  adminAccess: boolean;
  appAccess: boolean;
}>;

export async function updateRole(roleId: string, patch: UpdateRoleInput): Promise<DirectusRoleLite> {
  const payload: Partial<DirectusRolePayload> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description ?? null;
  if (patch.adminAccess !== undefined) payload.admin_access = !!patch.adminAccess;
  if (patch.appAccess !== undefined) payload.app_access = patch.appAccess ?? true;
  const updated = await directusService.request(
    uItem('directus_roles', roleId, payload as any)
  );
  return updated as DirectusRoleLite;
}

export async function getDirectusUserById(userId: string): Promise<DirectusUserLite | null> {
  const row = await directusService
    .request(
      rItem('directus_users', userId, {
        fields: ['id', 'email', 'first_name', 'last_name', 'status', 'role.id', 'role.name', 'role.admin_access', 'role.app_access'] as any,
      } as any)
    )
    .catch(() => null);
  return (row ?? null) as DirectusUserLite | null;
}
export async function getRoleById(roleId: string): Promise<DirectusRoleLite | null> {
  const row = await directusService
    .request(
      rItem('directus_roles', roleId, {
        fields: ['id', 'name', 'description', 'admin_access', 'app_access'] as any,
      } as any)
    )
    .catch(() => null);
  return (row ?? null) as DirectusRoleLite | null;
}

export async function searchUsers(
  q?: string,
  roleId?: string,
  status?: string,
  limit = 20,
  page = 1
): Promise<{ items: DirectusUserLite[]; total: number }> {
  const filter: Record<string, unknown> = {};
  if (roleId) filter.role = { _eq: roleId };
  if (status) filter.status = { _eq: status };

  const items = await directusService
    .request(
      rItems('directus_users', {
        search: q || undefined,
        limit,
        page,
        filter: Object.keys(filter).length ? (filter as any) : undefined,
        fields: ['id', 'email', 'first_name', 'last_name', 'status', 'role.id', 'role.name', 'role.admin_access', 'role.app_access'] as any,
        sort: ['email'] as any,
      } as any)
    )
    .catch(() => []) as DirectusUserLite[];

  const url = new URL(`${DIRECTUS_URL}/items/directus_users`);
  if (q) url.searchParams.set('search', q);
  if (roleId) url.searchParams.set('filter[role][_eq]', roleId);
  if (status) url.searchParams.set('filter[status][_eq]', status);
  url.searchParams.set('limit', '0');
  url.searchParams.set('meta', 'total_count');
  let total = items.length;
  try {
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
      cache: 'no-store',
    });
    if (response.ok) {
      const json = (await response.json()) as CollectionResponse<DirectusUserLite>;
      if (typeof json?.meta?.total_count === 'number') {
        total = json.meta.total_count;
      }
    }
  } catch {}

  return { items, total };
}

export async function setUserRole(userId: string, roleId: string) {
  return directusService.request(
    uItem('directus_users', userId, {
      role: roleId,
    } as any)
  );
}

// Legacy block check by email (usuarios)
export async function getLegacyUserByEmail(email?: string | null) {
  const e = (email || '').trim();
  if (!e) return null;
  const rows = await directusService
    .request(
      rItems(
        USERS_TABLE as any,
        {
          filter: { email: { _eq: e } } as any,
          fields: ['id', 'email', 'banido', 'ativado'] as any,
          limit: 1 as any,
        } as any
      )
    )
    .catch(() => []);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
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
  const applyFilters = (params: URLSearchParams) => {
    if (q) params.set('search', q);
    if (filters?.roleName) params.set('filter[role][_eq]', String(filters.roleName));
    if (filters?.status) params.set('filter[status][_eq]', String(filters.status));
  };

  const fetchTotalCount = async (): Promise<number | null> => {
    const totalUrl = new URL(`${DIRECTUS_URL}/items/${encodeURIComponent(USERS_TABLE)}`);
    applyFilters(totalUrl.searchParams);
    totalUrl.searchParams.set('limit', '0');
    totalUrl.searchParams.set('meta', 'total_count');
    try {
      const response = await fetch(totalUrl.toString(), {
        headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
        cache: 'no-store',
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as CollectionResponse<LegacyUserLite>;
      return typeof payload?.meta?.total_count === 'number' ? payload.meta.total_count : null;
    } catch {
      return null;
    }
  };

  // Try via SDK first; if empty, we'll fallback to REST
  try {
    const params: Record<string, unknown> = {
      limit,
      page,
      fields: ['id', 'email', 'nick', 'status', 'role', 'banido', 'ativado'],
    };
    if (q) params.search = q;
    const filter: Record<string, unknown> = {};
    if (filters?.roleName) filter.role = { _eq: filters.roleName };
    if (filters?.status) filter.status = { _eq: filters.status };
    if (Object.keys(filter).length > 0) {
      params.filter = filter as any;
    }
    const items = (await directusService
      .request(
        rItems(
          USERS_TABLE as any,
          params as any
        )
      )
      .catch(() => [])) as LegacyUserLite[];

    if (Array.isArray(items) && items.length > 0) {
      const total = await fetchTotalCount();
      return { items, total: total ?? items.length };
    }
  } catch {}

  // Fallback via REST (bypasses SDK quirks)
  try {
    const url = new URL(`${DIRECTUS_URL}/items/${encodeURIComponent(USERS_TABLE)}`);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('page', String(page));
    url.searchParams.set('fields', 'id,email,nick,status,role,banido,ativado');
    applyFilters(url.searchParams);
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${SERVICE_TOKEN}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`LEGACY_USERS_FETCH_FAILED:${response.status}`);
    const payload = (await response.json()) as CollectionResponse<LegacyUserLite>;
    const items = Array.isArray(payload?.data) ? payload.data : [];
    const total = await fetchTotalCount();
    return { items, total: total ?? items.length };
  } catch {}

  return { items: [], total: 0 };
}

export async function setLegacyUserRole(userId: number | string, roleName: string) {
  const payload: Partial<LegacyUserRecord> = { role: roleName };
  return directusService.request(
    uItem(USERS_TABLE as any, String(userId), payload as any)
  );
}

export async function setDirectusUserStatus(userId: string, status: 'active' | 'suspended') {
  const payload: Partial<DirectusUserLite> = { status };
  return directusService.request(
    uItem('directus_users', userId, payload as any),
  );
}

export async function deleteDirectusUser(userId: string) {
  return directusService.request(dItem('directus_users', userId));
}

export async function setLegacyUserBanStatus(userId: number | string, banned: boolean) {
  const payload: Partial<LegacyUserLite> & { status: string } = {
    banido: banned ? 's' : 'n',
    ativado: banned ? 'n' : 's',
    status: banned ? 'suspended' : 'active',
  };
  return directusService.request(
    uItem(USERS_TABLE as any, String(userId), payload as any)
  );
}

export async function deleteLegacyUser(userId: number | string) {
  return directusService.request(dItem(USERS_TABLE as any, String(userId)));
}

export type TeamMember = {
  id: number
  nick: string
  role: string
  joinedAt: string | null
  twitter?: string | null
};

type LegacyTeamRow = {
  id?: number | string | null;
  nick?: string | null;
  role?: string | null;
  data_criacao?: string | null;
  created_at?: string | null;
  joined_at?: string | null;
  banido?: string | null;
  ativado?: string | null;
  status?: string | null;
  twitter?: string | null;
  social_twitter?: string | null;
  socials?: { twitter?: string | null } | null;
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
      rItems(
        USERS_TABLE as any,
        {
          filter: {
            role: { _in: Array.from(normalized.values()) } as any,
            banido: { _neq: 's' } as any,
            ativado: { _neq: 'n' } as any,
          } as any,
          limit: 200 as any,
          sort: ['role', 'nick'] as any,
        } as any
      )
    )
    .catch(() => [])) as LegacyTeamRow[];

  const ensureString = (value: unknown): string =>
    typeof value === 'string' ? value : value == null ? '' : String(value);

  for (const raw of rows) {
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

    const computedId =
      raw?.id != null && !Number.isNaN(Number(raw.id))
        ? Number(raw.id)
        : Math.abs(
            nick
              .toLowerCase()
              .split('')
              .reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0)
          );

    result[canonicalRole].push({
      id: computedId,
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
function normalizeBcrypt(hash?: string): string | undefined {
  if (!hash) return undefined;
  return hash.startsWith('$2y$') ? `$2a$${hash.slice(4)}` : hash;
}

export function isBcrypt(hash?: string) {
  if (!hash) return false;
  const h = normalizeBcrypt(hash);
  return /^\$2[ab]\$/.test(h || '');
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
    const fixed = normalizeBcrypt(stored) || stored;
    return bcrypt.compareSync(plain, fixed);
  }
  // fallback MD5 legacy
  return md5(plain) === stored;
}

// ================== Helpers bool 's'/'n' ==================
export function asTrue(v: unknown): boolean {
  const normalized = typeof v === 'string' ? v.trim().toLowerCase() : v;
  return (
    normalized === true ||
    normalized === 1 ||
    normalized === '1' ||
    normalized === 's' ||
    normalized === 'y' ||
    normalized === 'sim' ||
    normalized === 'yes' ||
    normalized === 'ativo'
  );
}
export function asFalse(v: unknown): boolean {
  return !asTrue(v);
}

// ================== Acc?s utilisateurs ==================
type LegacyUserRecord = {
  id?: number | string | null;
  nick?: string | null;
  senha?: string | null;
  email?: string | null;
  avatar?: string | null;
  missao?: string | null;
  ativado?: string | null;
  banido?: string | null;
  status?: string | null;
  role?: string | null;
  data_criacao?: string | null;
  habbo_hotel?: string | null;
  habbo_unique_id?: string | null;
  habbo_verification_status?: HabboVerificationStatus | null;
  habbo_verification_code?: string | null;
  habbo_verification_expires_at?: string | null;
  habbo_verified_at?: string | null;
  habbo_name?: string | null;
  habbo_core_snapshot?: unknown;
  habbo_snapshot_at?: string | null;
};
const USER_FIELDS = [
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
  'habbo_hotel',
  'habbo_unique_id',
  'habbo_verification_status',
  'habbo_verification_code',
  'habbo_verification_expires_at',
  'habbo_verified_at',
] as const;

export function normalizeHotelCode(hotel?: string | null): 'fr' | 'com' | 'com.br' {
  const value = typeof hotel === 'string' ? hotel.trim().toLowerCase() : '';
  if (value === 'com') return 'com';
  if (value === 'com.br' || value === 'br' || value === 'combr') return 'com.br';
  return 'fr';
}

export async function listUsersByNick(nick: string) {
  const raw = await directusService
    .request(
      rItems(USERS_TABLE as any, {
        filter: { nick: { _eq: nick } } as any,
        limit: 50 as any,
        fields: USER_FIELDS,
      } as any)
    )
    .catch(() => []);
  return Array.isArray(raw) ? raw : [];
}

export async function getUserByNick(nick: string, hotel?: string | null) {
  const normalized = hotel ? normalizeHotelCode(hotel) : null;
  const filter =
    normalized === null
      ? { nick: { _eq: nick } }
      : normalized === 'fr'
        ? {
            _and: [
              { nick: { _eq: nick } },
              {
                _or: [
                  { habbo_hotel: { _eq: normalized } },
                  { habbo_hotel: { _null: true } },
                  { habbo_hotel: { _empty: true } },
                ],
              },
            ],
          }
        : {
            _and: [
              { nick: { _eq: nick } },
              { habbo_hotel: { _eq: normalized } },
            ],
          };

  const raw = await directusService
    .request(
      rItems(USERS_TABLE as any, {
        filter: filter as any,
        limit: 1 as any,
        fields: USER_FIELDS,
      } as any)
    )
    .catch(() => []);
  const rows = Array.isArray(raw) ? raw : [];
  return rows.length ? rows[0] : null;
}

export async function createUser(data: {
  nick: string;
  senha: string; // plain
  email?: string | null;
  missao?: string | null;
  habboHotel?: string | null;
  habboUniqueId?: string | null;
  verificationStatus?: HabboVerificationStatus;
  verificationCode?: string | null;
  verificationExpiresAt?: string | null;
  verifiedAt?: string | null;
  ativado?: 's' | 'n';
}) {
    const payload: LegacyUserRecord = {
    nick: data.nick,
    senha: hashPassword(data.senha),
    email: data.email ?? null,
    missao: data.missao ?? 'Mission Habbo: HabboOneRegister-0',
    ativado: data.ativado ?? 'n', // par défaut, attente vérification
    banido: 'n',
    data_criacao: new Date().toISOString(),
    habbo_hotel: data.habboHotel ?? null,
    habbo_unique_id: data.habboUniqueId ?? null,
    habbo_verification_status: data.verificationStatus ?? ('pending' as HabboVerificationStatus),
    habbo_verification_code: data.verificationCode ?? null,
    habbo_verification_expires_at: data.verificationExpiresAt ?? null,
    habbo_verified_at: data.verifiedAt ?? null,
    // status omis: laisser Directus d?finir la valeur par d?faut si n?cessaire
  };
  return directusService.request(
    cItem(USERS_TABLE as any, payload as any)
  );
}

export async function upgradePasswordToBcrypt(userId: number, plain: string) {
  return directusService.request(
    uItem(USERS_TABLE as any, userId as any, {
      senha: hashPassword(plain),
    })
  );
}

export async function updateUserVerification(
  userId: number,
  patch: Partial<{
    habbo_hotel: string | null;
    habbo_unique_id: string | null;
    habbo_verification_status: HabboVerificationStatus | null;
    habbo_verification_code: string | null;
    habbo_verification_expires_at: string | null;
    habbo_verified_at: string | null;
    ativado: 's' | 'n';
  }>
) {
  return directusService.request(
    uItem(USERS_TABLE as any, userId as any, patch as any)
  );
}

export async function markUserAsVerified(userId: number) {
  const nowIso = new Date().toISOString();
  return updateUserVerification(userId, {
    habbo_verification_status: 'ok',
    habbo_verification_code: null,
    habbo_verification_expires_at: null,
    habbo_verified_at: nowIso,
    ativado: 's',
  });
}

// ================== Habbo snapshot cache (best-effort) ==================
/**
 * Tente de stocker un snapshot basique du profil Habbo dans la table utilisateurs.
 * Ne fait rien si les colonnes n'existent pas c?t? Directus (erreur aval?e).
 * Colonnes attendues si vous souhaitez persister ces donn?es:
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
    const payload: Partial<LegacyUserRecord> = {
      habbo_unique_id: core.uniqueId,
      habbo_name: core.name,
      habbo_core_snapshot: core,
      habbo_snapshot_at: new Date().toISOString(),
    };
    await directusService.request(
      uItem(USERS_TABLE as any, userId as any, payload as any)
    );
    return true;
  } catch {
    // Si les colonnes n'existent pas, on ignore pour ne pas bloquer le flux d'inscription
    return false;
  }
}
// Users listing (read-only)
export async function adminListUsers(limit = 500) {
  return directusService.request(
    rItems(USERS_TABLE as any, {
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
    } as any)
  );
}

export type NewsRecord = {
  id: number;
  titulo: string;
  descricao?: string | null;
  imagem?: string | null;
  noticia?: string | null;
  autor?: string | null;
  data?: string | null;
  status?: string | null;
};

export type NewsCommentRecord = {
  id: number;
  id_noticia: number;
  comentario: string;
  autor?: string | null;
  data?: string | null;
  status?: string | null;
};

export type ForumTopicRecord = {
  id: number;
  titulo: string;
  conteudo?: string | null;
  imagem?: string | null;
  autor?: string | null;
  data?: string | null;
  views?: number | null;
  fixo?: boolean | number | string;
  fechado?: boolean | number | string;
  status?: string | null;
  cat_id?: number | null;
};

export type ForumPostRecord = {
  id: number;
  id_topico: number;
  conteudo: string;
  autor?: string | null;
  data?: string | null;
  status?: string | null;
};

export type ForumCommentRecord = {
  id: number;
  id_forum: number;
  comentario: string;
  autor?: string | null;
  data?: string | null;
  status?: string | null;
};

export type ForumCategoryRecord = {
  id: number;
  nome: string;
  descricao?: string | null;
  status?: string | null;
  imagem?: string | null;
};

// News (articles)
export async function adminListNews(limit = 500): Promise<NewsRecord[]> {
  return directusService.request(
    rItems('noticias', {
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
    } as any)
  ) as Promise<NewsRecord[]>;
}

export async function adminCreateNews(data: {
  titulo: string;
  descricao?: string | null;
  imagem?: string | null;
  noticia: string;
  autor?: string | null;
  data?: string | null;
  status?: string | null;
}): Promise<NewsRecord> {
  const payload: any = {
    titulo: data.titulo,
    descricao: data.descricao ?? null,
    imagem: data.imagem ?? null,
    noticia: data.noticia,
    autor: data.autor ?? null,
    data: data.data ?? new Date().toISOString(),
    status: data.status ?? null,
  };
  return directusService.request(cItem('noticias', payload)) as Promise<NewsRecord>;
}

export async function adminUpdateNews(id: number, patch: Partial<{
  titulo: string;
  descricao: string | null;
  imagem: string | null;
  noticia: string;
  autor: string | null;
  data: string | null;
  status: string | null;
}>): Promise<NewsRecord> {
  return directusService.request(uItem('noticias', id, patch as any)) as Promise<NewsRecord>;
}

export async function adminDeleteNews(id: number) {
  return directusService.request(dItem('noticias', id));
}

export async function listNewsByAuthorService(author: string, limit = 30): Promise<NewsRecord[]> {
  if (!author) return [];
  const rows = await directusService.request(
    rItems('noticias', {
      filter: { autor: { _eq: author } } as any,
      fields: ['id', 'titulo', 'descricao', 'imagem', 'autor', 'data', 'status'] as any,
      sort: ['-data'] as any,
      limit: limit as any,
    } as any)
  ).catch(() => [] as NewsRecord[]);
  return Array.isArray(rows) ? (rows as NewsRecord[]) : [];
}

export async function adminListNewsComments(limit = 500, newsId?: number): Promise<NewsCommentRecord[]> {
  return directusService.request(
    rItems('noticias_coment', {
      limit,
      sort: ['-data'],
      filter: newsId ? { id_noticia: { _eq: newsId } } : undefined,
      fields: ['id', 'id_noticia', 'comentario', 'autor', 'data', 'status'],
    } as any)
  ) as Promise<NewsCommentRecord[]>;
}

export async function adminUpdateNewsComment(
  id: number,
  patch: Partial<{ comentario: string; autor: string | null; data: string | null; status: string | null }>
): Promise<NewsCommentRecord> {
  return directusService.request(uItem('noticias_coment', id, patch as any)) as Promise<NewsCommentRecord>;
}

export async function adminDeleteNewsComment(id: number) {
  return directusService.request(dItem('noticias_coment', id));
}

// Forum (topics, posts)
export async function adminListForumTopics(limit = 200): Promise<ForumTopicRecord[]> {
  return directusService.request(
    rItems('forum_topicos', {
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
        'status',
        'cat_id',
      ],
    } as any)
  ) as Promise<ForumTopicRecord[]>;
}

export async function listForumCategoriesService(): Promise<ForumCategoryRecord[]> {
  return directusService.request(
    rItems('forum_cat', {
      limit: 100 as any,
      sort: ['nome'] as any,
      fields: ['id', 'nome', 'descricao', 'status', 'imagem'] as any,
    } as any)
  ) as Promise<ForumCategoryRecord[]>;
}

export async function listForumTopicsWithCategories(limit = 50): Promise<ForumTopicRecord[]> {
  return directusService.request(
    rItems('forum_topicos', {
      limit,
      sort: ['-data'],
      fields: ['id', 'titulo', 'conteudo', 'imagem', 'autor', 'data', 'views', 'fixo', 'fechado', 'status', 'cat_id'] as any,
    } as any)
  ) as Promise<ForumTopicRecord[]>;
}

export async function adminCreateForumPost(data: {
  id_topico: number;
  conteudo: string;
  autor?: string | null;
  data?: string | null;
  status?: string | null;
}): Promise<ForumPostRecord> {
  const payload: any = {
    id_topico: data.id_topico,
    conteudo: data.conteudo,
    autor: data.autor ?? null,
    data: data.data ?? new Date().toISOString(),
    status: data.status ?? null,
  };
  return directusService.request(cItem('forum_posts', payload)) as Promise<ForumPostRecord>;
}

export async function adminUpdateForumPost(id: number, patch: Partial<{
  conteudo: string;
  autor: string | null;
  data: string | null;
  status: string | null;
}>): Promise<ForumPostRecord> {
  return directusService.request(uItem('forum_posts', id, patch as any)) as Promise<ForumPostRecord>;
}

export async function adminDeleteForumPost(id: number) {
  return directusService.request(dItem('forum_posts', id));
}

export async function createNewsComment(input: {
  newsId: number;
  author: string;
  content: string;
  status?: string | null;
}): Promise<NewsCommentRecord> {
  const payload: Record<string, unknown> = {
    id_noticia: input.newsId,
    comentario: input.content,
    autor: input.author || 'Anonyme',
    data: new Date().toISOString(),
    status: input.status ?? 'public',
  };
  return directusService.request(cItem('noticias_coment', payload as any)) as Promise<NewsCommentRecord>;
}

export async function adminListForumComments(limit = 500, topicId?: number): Promise<ForumCommentRecord[]> {
  return directusService.request(
    rItems('forum_coment', {
      limit,
      sort: ['-data'],
      filter: topicId ? { id_forum: { _eq: topicId } } : undefined,
      fields: ['id', 'id_forum', 'comentario', 'autor', 'data', 'status'],
    } as any)
  ) as Promise<ForumCommentRecord[]>;
}

export async function adminUpdateForumComment(
  id: number,
  patch: Partial<{ comentario: string; autor: string | null; data: string | null; status: string | null }>
): Promise<ForumCommentRecord> {
  return directusService.request(uItem('forum_coment', id, patch as any)) as Promise<ForumCommentRecord>;
}

export async function adminDeleteForumComment(id: number) {
  return directusService.request(dItem('forum_coment', id));
}

// ---------- Forum (public helpers) ----------
export async function createForumComment(input: {
  topicId: number
  author: string
  content: string
  status?: string | null
}): Promise<ForumCommentRecord> {
  const payload: any = {
    id_forum: input.topicId,
    comentario: input.content,
    autor: input.author || 'Anonyme',
    data: new Date().toISOString(),
    status: input.status ?? 'public',
  }
  return directusService.request(cItem('forum_coment', payload)) as Promise<ForumCommentRecord>
}

export async function toggleForumCommentLike(commentId: number, author: string) {
  // 1) Try to find an existing like tied to this author
  const byAuthor = await directusService
    .request(
      rItems('forum_coment_curtidas' as any, {
        filter: {
          id_comentario: { _eq: commentId } as any,
          ...(author ? ({ autor: { _eq: author } } as any) : {}),
        } as any,
        limit: 1 as any,
        fields: ['id'] as any,
      } as any)
    )
    .catch(() => []) as any[]

  if (Array.isArray(byAuthor) && byAuthor.length > 0) {
    const id = (byAuthor[0] as any)?.id
    if (id != null) {
      await directusService.request(dItem('forum_coment_curtidas' as any, id as any))
      return { liked: false }
    }
  }

  // 2) Not found by author, try to insert (with graceful fallback)
  const payload: any = { id_comentario: commentId }
  if (author) payload.autor = author
  try {
    await directusService.request(cItem('forum_coment_curtidas' as any, payload))
    return { liked: true }
  } catch {
    // 3) If insert fails (unique constraint or author column missing),
    // attempt to toggle by comment only (delete any existing row for this comment)
    const anyRow = await directusService
      .request(
        rItems('forum_coment_curtidas' as any, {
          filter: { id_comentario: { _eq: commentId } } as any,
          limit: 1 as any,
          fields: ['id'] as any,
        } as any)
      )
      .catch(() => []) as any[]
    const existingId = Array.isArray(anyRow) && anyRow.length ? (anyRow[0] as any)?.id : null
    if (existingId != null) {
      await directusService.request(dItem('forum_coment_curtidas' as any, existingId as any))
      return { liked: false }
    }
    // Last resort: try insert without author
    await directusService.request(cItem('forum_coment_curtidas' as any, { id_comentario: commentId } as any))
    return { liked: true }
  }
}

export async function reportForumComment(commentId: number, author: string) {
  const payload: any = {
    tipo: 'report',
    alvo_tipo: 'comment',
    alvo_id: commentId,
    autor: author || null,
    data: new Date().toISOString(),
  }
  try {
    return await directusService.request(cItem('forum_interacoes' as any, payload))
  } catch {
    return null
  }
}

export async function setTopicVote(topicId: number, author: string, vote: 1 | -1) {
  // Upsert by (topicId, author)
  const rows = await directusService
    .request(
      rItems('forum_topicos_votos' as any, {
        filter: { id_topico: { _eq: topicId }, ...(author ? ({ autor: { _eq: author } } as any) : {}) } as any,
        limit: 1 as any,
        fields: ['id'] as any,
      } as any)
    )
    .catch(() => []) as any[]
  if (Array.isArray(rows) && rows.length > 0) {
    const id = (rows[0] as any)?.id
    if (id != null) {
      await directusService.request(uItem('forum_topicos_votos' as any, id as any, { voto: vote } as any))
      return { updated: true }
    }
  }
  const payload: any = { id_topico: topicId, voto: vote }
  if (author) payload.autor = author
  await directusService.request(cItem('forum_topicos_votos' as any, payload))
  return { created: true }
}

export async function getTopicVoteSummary(topicId: number): Promise<{ up: number; down: number }> {
  const count = async (v: 1 | -1) => {
    const url = new URL(`${DIRECTUS_URL}/items/${encodeURIComponent('forum_topicos_votos')}`)
    url.searchParams.set('limit', '0')
    url.searchParams.set('meta', 'total_count')
    url.searchParams.set('filter[id_topico][_eq]', String(topicId))
    url.searchParams.set('filter[voto][_eq]', String(v))
    try {
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${SERVICE_TOKEN}` }, cache: 'no-store' })
      if (!res.ok) return 0
      const json = await res.json()
      const n = Number((json as any)?.meta?.total_count ?? 0)
      return Number.isFinite(n) ? n : 0
    } catch { return 0 }
  }
  const [up, down] = await Promise.all([count(1), count(-1)])
  return { up, down }
}
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
}>): Promise<ForumTopicRecord> {
  return directusService.request(uItem('forum_topicos', id, patch as any)) as Promise<ForumTopicRecord>;
}

export async function adminDeleteForumTopic(id: number) {
  return directusService.request(dItem('forum_topicos', id));
}

export async function getUserMoedas(userId: number): Promise<number> {
  const row = await directusService
    .request(rItem(USERS_TABLE as any, userId as any, { fields: ['moedas'] as any } as any))
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
  if (STORIES_FOLDER_ID) formData.set('folder', STORIES_FOLDER_ID);

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
    published_at: input.status === 'draft' ? null : nowIso,
  };
  if (input.title) payload.titulo = input.title;

  try {
    return await directusService.request(cItem(table as any, payload as any));
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
  url.searchParams.set('filter[_or][0][published_at][_gte]', startIso);
  url.searchParams.set('filter[_or][1][date_created][_gte]', startIso);
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
      rItems(table as any, {
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
  for (const col of resolveStoriesTables()) {
    try {
      const rows = await directusService.request(
        rItems(col as any, {
          // Do not specify fields to avoid 400 on unknown field names across installs
          sort: ['-id'] as any,
          limit,
        } as any)
      )
      if (Array.isArray(rows) && rows.length) return rows as any[]
    } catch {}
  }
  return [] as any[]
}

