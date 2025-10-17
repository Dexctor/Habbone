// app/api/habbo/profile/route.ts
import { NextResponse } from 'next/server';
import {
  getHabboUserByName,
  getHabboUserById,
  getHabboUserProfileById,
  getHabboFriendsById,
  getHabboGroupsById,
  getHabboRoomsById,
  getHabboBadgesById,
  getHabboAchievementsById,
  getAllAchievements,
} from '@/server/habbo-cache';
import { HabboProfileQuerySchema, searchParamsToObject, formatZodError, buildError } from '@/types/api';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = HabboProfileQuerySchema.safeParse(searchParamsToObject(searchParams));
      if (!parsed.success) {
        return NextResponse.json(
          buildError('Erreur de validation', { code: 'VALIDATION_ERROR', fields: formatZodError(parsed.error).fieldErrors }),
          { status: 400 }
        );
      }

      const isLite = Boolean((parsed.data as any).lite);

    // 1) Core user (récupère uniqueId)
    const core = 'id' in parsed.data
      ? await getHabboUserById(parsed.data.id)
      : await getHabboUserByName(parsed.data.name);
      const uniqueId = core?.uniqueId;
      if (!uniqueId) {
        return NextResponse.json(
          { error: 'Utilisateur Habbo introuvable.' },
          { status: 404 }
        );
      }

      // Lite mode: only user + profile (reduces calls drastically)
      if (isLite) {
        const onlyProfile = await Promise.allSettled([
          getHabboUserProfileById(uniqueId),
        ]);
        const profile = onlyProfile[0].status === 'fulfilled' ? onlyProfile[0].value : null;
        return NextResponse.json(
          {
            user: core,
            profile,
            friends: [],
            groups: [],
            rooms: [],
            badges: [],
            uniqueId,
            achievements: [],
          },
          { headers: { 'Cache-Control': 'no-store' } }
        );
      }

    // 2) Appels parallèles, tolérants aux profils privés
      const [profileRes, friendsRes, groupsRes, roomsRes, badgesRes, achievementsRes, achievementsCatalogRes] = await Promise.allSettled([
        getHabboUserProfileById(uniqueId),
        getHabboFriendsById(uniqueId),
        getHabboGroupsById(uniqueId),
        getHabboRoomsById(uniqueId),
        getHabboBadgesById(uniqueId),
        getHabboAchievementsById(uniqueId),
        getAllAchievements(),
      ]);

    const profile = profileRes.status === 'fulfilled' ? profileRes.value : null;
    const friends = friendsRes.status === 'fulfilled' ? friendsRes.value : [];
    const groups = groupsRes.status === 'fulfilled' ? groupsRes.value : [];
    const rooms = roomsRes.status === 'fulfilled' ? roomsRes.value : [];
    const badgesRaw = badgesRes.status === 'fulfilled' ? badgesRes.value : [];
    const achievements = achievementsRes.status === 'fulfilled' ? achievementsRes.value : [];
    const achievementsTotal = achievementsCatalogRes.status === 'fulfilled' ? achievementsCatalogRes.value : [];

    // ---- Enrich badges with reliable album/image hints using achievements catalog ----
    const achCodeSet = new Set<string>();
    try {
      const arr: any[] = Array.isArray(achievementsTotal) ? (achievementsTotal as any[]) : [];
      for (const row of arr) {
        const c = (row?.code || row?.badgeCode || row?.badge_code || row?.badge?.code || '').toString().trim().toUpperCase();
        if (c) achCodeSet.add(c);
      }
    } catch {}
    const badges = (Array.isArray(badgesRaw) ? badgesRaw : []).map((b: any) => {
      const rawCode = (b?.code || b?.badgeCode || b?.badge_code || b?.badge?.code || '').toString().trim();
      const up = rawCode.toUpperCase();
      let album = (b?.album || b?.badgeAlbum || b?.category || b?.badgeCategory || null) as string | null;
      if (!album && up && (up.startsWith('ACH_') || achCodeSet.has(up))) {
        album = 'album1584';
      }
      return { ...b, code: rawCode, album };
    });

    return NextResponse.json(
      {
        user: core,
        profile,
        friends,
        groups,
        rooms,
        badges,
        uniqueId,
        achievements,
        achievementsCount: Array.isArray(achievements) ? achievements.length : 0,
        achievementsTotalCount: Array.isArray(achievementsTotal) ? achievementsTotal.length : 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (e: any) {
    const msg = e?.message || '';
    const notFound = /404/.test(msg);
    return NextResponse.json(
      buildError(notFound ? 'Utilisateur Habbo introuvable.' : 'Erreur Habbo API', { code: notFound ? 'HABBO_NOT_FOUND' : 'HABBO_ERROR' }),
      { status: notFound ? 404 : 502 }
    );
  }
}
