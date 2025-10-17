import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertAdmin } from '@/server/authz';
import { searchUsers, getLegacyUserByEmail, listRoles, searchLegacyUsuarios } from '@/server/directus-service';

const Body = z.object({
  q: z.string().optional(),
  roleId: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export async function POST(req: Request) {
  try {
    await assertAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'FORBIDDEN', code: 'FORBIDDEN' }, { status: e?.status || 403 });
  }

  const url = new URL(req.url);
  const preferSource = (url.searchParams.get('source') || 'auto').toLowerCase();
  const forceLegacy = preferSource === 'legacy';
  const forceDirectus = preferSource === 'directus';

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_BODY', code: 'INVALID_BODY' }, { status: 400 });
  }
  const { q, roleId, status, page, limit } = parsed.data;
  try {
    // 1) Preparer la correspondance roles
    const roles = await listRoles().catch(() => [] as any[]);
    const rolesById = new Map<string, any>(roles.map((r: any) => [String(r?.id), r]));
    const roleRecord = roleId ? rolesById.get(String(roleId)) : undefined;
    const roleNameTarget = roleRecord ? String(roleRecord.name || '').toLowerCase() : undefined;

    // 2) Legacy (prioritaire si force ou si resultats)
    let legacy: { items: any[]; total: number } | null = null;
    if (!forceDirectus) {
      legacy = await searchLegacyUsuarios(q, limit, page, {
        roleName: roleRecord?.name ?? undefined,
        status,
      }).catch(() => ({ items: [], total: 0 }));
    } else {
      legacy = { items: [], total: 0 };
    }

    if (legacy && (forceLegacy || (Array.isArray(legacy.items) && legacy.items.length > 0 && !forceDirectus))) {
      let mapped = legacy.items.map((row: any) => {
        const banido = String(row?.banido || '').toLowerCase();
        const ativado = String(row?.ativado || '').toLowerCase();
        const isBanned = ['1', 'true', 's', 'y', 'sim'].includes(banido);
        const isActive = !['0', 'false', 'n', 'nao', 'no'].includes(ativado);
        const roleNameRaw = String(row?.role || '').trim();
        const roleMatch = roles.find((r: any) => String(r?.name || '').toLowerCase() === roleNameRaw.toLowerCase()) || null;
        const rolePayload = roleMatch
          ? {
              id: roleMatch.id,
              name: roleMatch.name,
              admin_access: roleMatch.admin_access,
              app_access: roleMatch.app_access,
            }
          : null;
        const displayRoleName = rolePayload?.name || roleNameRaw || null;
        return {
          id: `legacy:${row.id}`,
          email: row.email || null,
          first_name: row.nick || null,
          last_name: null,
          status: isActive ? 'active' : 'suspended',
          role: rolePayload,
          _legacyBanned: !!isBanned,
          _legacyInactive: !isActive,
          _source: 'legacy',
          _roleName: displayRoleName,
        };
      });
      if (roleNameTarget) mapped = mapped.filter((u) => String((u as any)?._roleName || '').toLowerCase() === roleNameTarget);
      if (status) mapped = mapped.filter((u) => String((u as any)?.status) === status);
      return NextResponse.json({ data: mapped, total: legacy?.total || mapped.length });
    }

    if (forceLegacy) {
      // Force legacy mais aucun resultat
      return NextResponse.json({ data: [], total: legacy?.total || 0 });
    }

    // 3) Directus
    const { items, total } = await searchUsers(q, roleId, status, limit, page).catch(() => ({ items: [], total: 0 }));
    const enriched = await Promise.all(
      (items || []).map(async (u: any) => {
        const legacyU = await getLegacyUserByEmail(u?.email || null).catch(() => null as any);
        const banido = String((legacyU as any)?.banido || '').toLowerCase();
        const ativado = String((legacyU as any)?.ativado || '').toLowerCase();
        const isBanned = ['1', 'true', 's', 'y', 'sim'].includes(banido);
        const isActive = !['0', 'false', 'n', 'nao', 'no'].includes(ativado);
        let roleIdValue: string | null = null;
        let roleNameValue: string | null = null;
        if (u?.role && typeof u.role === 'object') {
          roleIdValue = u.role?.id ? String(u.role.id) : null;
          roleNameValue = u.role?.name ? String(u.role.name) : null;
        } else if (u?.role) {
          roleIdValue = String(u.role);
        }
        if (!roleNameValue && roleIdValue) {
          const match = rolesById.get(String(roleIdValue));
          if (match) {
            roleNameValue = match.name || null;
          }
        }
        return { ...u, _legacyBanned: !!isBanned, _legacyInactive: !isActive, _source: 'directus', _roleName: roleNameValue };
      })
    );
    return NextResponse.json({ data: enriched, total });
  } catch (e: any) {
    return NextResponse.json({ error: 'SEARCH_FAILED', code: 'SEARCH_FAILED' }, { status: 500 });
  }
}
