// src/lib/habbo.ts

export const HABBO_API_BASE = process.env.HABBO_API_BASE || 'https://www.habbo.fr';

const HOTEL_BASES: Record<string, string> = {
  fr: 'https://www.habbo.fr',
  com: 'https://www.habbo.com',
  'com.br': 'https://www.habbo.com.br',
};

export function resolveHotelBase(hotel?: string) {
  if (!hotel) return HABBO_API_BASE;
  const normalized = hotel.toLowerCase();
  return HOTEL_BASES[normalized] || HABBO_API_BASE;
}

export interface HabboUserCore {
  uniqueId: string; // e.g. hhus-abcde12345
  name: string;
  figureString?: string;
  motto?: string;
  online?: boolean;
  lastAccessTime?: string; // ISO-like string
  memberSince?: string; // ISO-like string
  profileVisible?: boolean;
  currentLevel?: number;
  currentLevelCompletePercent?: number;
  totalExperience?: number;
  starGemCount?: number;
  selectedBadges?: Array<any>;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[HabboAPI] ${res.status} ${res.statusText} ${text}`);
  }
  return res.json() as Promise<T>;
}

// By name: GET /api/public/users?name={name}
export async function getHabboUserByName(name: string): Promise<HabboUserCore> {
  const url = new URL(`${HABBO_API_BASE}/api/public/users`);
  url.searchParams.set('name', name);
  return fetchJson<HabboUserCore>(url.toString());
}

export async function getHabboUserByNameForHotel(name: string, hotel?: string): Promise<HabboUserCore> {
  const base = resolveHotelBase(hotel);
  const url = new URL(`${base}/api/public/users`);
  url.searchParams.set('name', name);
  return fetchJson<HabboUserCore>(url.toString());
}

// By uniqueId: GET /api/public/users/{id}
export async function getHabboUserById(id: string): Promise<HabboUserCore> {
  const url = `${HABBO_API_BASE}/api/public/users/${encodeURIComponent(id)}`;
  return fetchJson<HabboUserCore>(url);
}

export async function getHabboUserByIdForHotel(id: string, hotel?: string): Promise<HabboUserCore> {
  const base = resolveHotelBase(hotel);
  const url = `${base}/api/public/users/${encodeURIComponent(id)}`;
  return fetchJson<HabboUserCore>(url);
}

// Heavy/related endpoints (fetched on-demand)
export async function getHabboUserProfileById(id: string): Promise<any> {
  const url = `${HABBO_API_BASE}/api/public/users/${encodeURIComponent(id)}/profile`;
  return fetchJson<any>(url);
}

export async function getHabboFriendsById(id: string): Promise<any[]> {
  const url = `${HABBO_API_BASE}/api/public/users/${encodeURIComponent(id)}/friends`;
  return fetchJson<any[]>(url);
}

export async function getHabboGroupsById(id: string): Promise<any[]> {
  const url = `${HABBO_API_BASE}/api/public/users/${encodeURIComponent(id)}/groups`;
  return fetchJson<any[]>(url);
}

export async function getHabboRoomsById(id: string): Promise<any[]> {
  const url = `${HABBO_API_BASE}/api/public/users/${encodeURIComponent(id)}/rooms`;
  return fetchJson<any[]>(url);
}

export async function getHabboBadgesById(id: string): Promise<any[]> {
  const url = `${HABBO_API_BASE}/api/public/users/${encodeURIComponent(id)}/badges`;
  return fetchJson<any[]>(url);
}

// Achievements by uniqueId
export async function getHabboAchievementsById(id: string): Promise<any[]> {
  const url = `${HABBO_API_BASE}/api/public/achievements/${encodeURIComponent(id)}`;
  return fetchJson<any[]>(url);
}

// All achievements (definitions) for the hotel
export async function getAllAchievements(): Promise<any[]> {
  const url = `${HABBO_API_BASE}/api/public/achievements`;
  return fetchJson<any[]>(url);
}
