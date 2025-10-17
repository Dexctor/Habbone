import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertAdmin } from '@/server/authz';
import {
  getDirectusUserById,
  getLegacyUserByEmail,
  setDirectusUserStatus,
  setLegacyUserBanStatus,
} from '@/server/directus-service';

const BodySchema = z.object({
  userId: z.string().min(1),
  ban: z.boolean(),
});

export async function POST(req: Request) {
  try {
    await assertAdmin();
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'FORBIDDEN', code: 'FORBIDDEN' },
      { status: error?.status || 403 },
    );
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_BODY', code: 'INVALID_BODY' }, { status: 400 });
  }

  const { userId, ban } = parsed.data;

  try {
    if (userId.startsWith('legacy:')) {
      const legacyId = userId.split(':')[1];
      await setLegacyUserBanStatus(legacyId, ban);
      return NextResponse.json({ data: true });
    }

    const directusUser = await getDirectusUserById(userId);
    if (!directusUser) {
      return NextResponse.json({ error: 'NOT_FOUND', code: 'NOT_FOUND' }, { status: 404 });
    }

    await setDirectusUserStatus(userId, ban ? 'suspended' : 'active');

    if (directusUser.email) {
      const legacyUser = await getLegacyUserByEmail(directusUser.email).catch(() => null as any);
      if (legacyUser?.id) {
        await setLegacyUserBanStatus(legacyUser.id, ban).catch(() => undefined);
      }
    }

    return NextResponse.json({ data: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'BAN_ACTION_FAILED', code: 'BAN_ACTION_FAILED' }, { status: 500 });
  }
}
