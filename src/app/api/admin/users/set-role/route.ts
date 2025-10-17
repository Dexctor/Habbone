import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertAdmin } from '@/server/authz';
import { getDirectusUserById, getLegacyUserByEmail, getRoleById, setLegacyUserRole, setUserRole } from '@/server/directus-service';

const Body = z.object({ userId: z.string().min(1), roleId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    await assertAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'FORBIDDEN', code: 'FORBIDDEN' }, { status: e?.status || 403 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_BODY', code: 'INVALID_BODY' }, { status: 400 });
  }

  const { userId, roleId } = parsed.data;
  try {
    // Legacy user id convention: legacy:123
    if (userId.startsWith('legacy:')) {
      const legacyId = userId.split(':')[1];
      const role = await getRoleById(roleId).catch(() => null);
      const roleName = (role as any)?.name || roleId; // fallback: accept roleId as name
      await setLegacyUserRole(legacyId, roleName);
      return NextResponse.json({ data: true });
    }

    const du = await getDirectusUserById(userId);
    const legacy = await getLegacyUserByEmail(du?.email || null);
    const banido = String((legacy as any)?.banido || '').toLowerCase();
    const ativado = String((legacy as any)?.ativado || '').toLowerCase();
    const isBanned = ['1', 'true', 's', 'y', 'sim'].includes(banido);
    const isActive = !['0', 'false', 'n', 'nao', 'não', 'no'].includes(ativado);
    if (legacy && (isBanned || !isActive)) {
      return NextResponse.json({ error: 'Utilisateur banni/inactif', code: 'USER_INACTIVE' }, { status: 403 });
    }

    await setUserRole(userId, roleId);
    return NextResponse.json({ data: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'SET_ROLE_FAILED', code: 'SET_ROLE_FAILED' }, { status: 500 });
  }
}
