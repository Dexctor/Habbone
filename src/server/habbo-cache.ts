import 'server-only'

// Server-side micro cache wrappers for Habbo API with TTLs
// Respect RULES.md: caching only on server, no secrets leaked

import {
  getHabboUserByName as rawGetHabboUserByName,
  getHabboUserById as rawGetHabboUserById,
  getHabboUserProfileById as rawGetHabboUserProfileById,
  getHabboFriendsById as rawGetHabboFriendsById,
  getHabboGroupsById as rawGetHabboGroupsById,
  getHabboRoomsById as rawGetHabboRoomsById,
  getHabboBadgesById as rawGetHabboBadgesById,
  getHabboAchievementsById as rawGetHabboAchievementsById,
  getAllAchievements as rawGetAllAchievements,
} from '@/lib/habbo'

type Entry<T> = { v: T; exp: number }

const CORE_TTL = 24 * 60 * 60 * 1000 // 24h
const HEAVY_TTL = 6 * 60 * 60 * 1000 // 6h
const CATALOG_TTL = 24 * 60 * 60 * 1000 // 24h

function now() {
  return Date.now()
}

function getStore() {
  const g = globalThis as any
  if (!g.__habboCache) {
    g.__habboCache = new Map<string, Entry<any>>()
  }
  return g.__habboCache as Map<string, Entry<any>>
}

async function getOrSet<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const store = getStore()
  const hit = store.get(key) as Entry<T> | undefined
  if (hit && hit.exp > now()) return hit.v
  const value = await fn()
  store.set(key, { v: value, exp: now() + ttl })
  return value
}

export async function getHabboUserByName(name: string) {
  const key = `core:name:${String(name).toLowerCase()}`
  return getOrSet(key, CORE_TTL, () => rawGetHabboUserByName(name))
}

export async function getHabboUserById(id: string) {
  const key = `core:id:${id}`
  return getOrSet(key, CORE_TTL, () => rawGetHabboUserById(id))
}

export async function getHabboUserProfileById(id: string) {
  const key = `profile:${id}`
  return getOrSet(key, HEAVY_TTL, () => rawGetHabboUserProfileById(id))
}

export async function getHabboFriendsById(id: string) {
  const key = `friends:${id}`
  return getOrSet(key, HEAVY_TTL, () => rawGetHabboFriendsById(id))
}

export async function getHabboGroupsById(id: string) {
  const key = `groups:${id}`
  return getOrSet(key, HEAVY_TTL, () => rawGetHabboGroupsById(id))
}

export async function getHabboRoomsById(id: string) {
  const key = `rooms:${id}`
  return getOrSet(key, HEAVY_TTL, () => rawGetHabboRoomsById(id))
}

export async function getHabboBadgesById(id: string) {
  const key = `badges:${id}`
  return getOrSet(key, HEAVY_TTL, () => rawGetHabboBadgesById(id))
}

export async function getHabboAchievementsById(id: string) {
  const key = `achievements:${id}`
  return getOrSet(key, HEAVY_TTL, () => rawGetHabboAchievementsById(id))
}

export async function getAllAchievements() {
  const key = `achievements:catalog`
  return getOrSet(key, CATALOG_TTL, () => rawGetAllAchievements())
}

