// app/api/register/route.ts
import { NextResponse } from 'next/server';
import {
  createUser,
  getUserByNick,
  listUsersByNick,
  normalizeHotelCode,
  tryUpdateHabboSnapshotForUser,
  updateUserVerification,
} from '@/server/directus-service';
import { getHabboUserByNameForHotel } from '@/lib/habbo';
import { RegisterBodySchema, formatZodError, buildError } from '@/types/api';
import { computeVerificationExpiry, generateVerificationCode } from '@/lib/verification';

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = RegisterBodySchema.safeParse({
      nick: String((raw?.nick ?? raw?.username ?? raw?.pseudo ?? raw?.Nick ?? '')).trim(),
      password: String((raw?.password ?? raw?.pass ?? '')).toString(),
      email: raw?.email ? String(raw?.email).trim() : undefined,
      hotel: raw?.hotel ?? raw?.habboHotel ?? raw?.hotelCode ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        buildError('Erreur de validation', { code: 'VALIDATION_ERROR', fields: formatZodError(parsed.error).fieldErrors }),
        { status: 400 }
      );
    }
    const { nick: n, password: p, email, hotel } = parsed.data as any;
    const hotelCode = normalizeHotelCode(hotel);
    const missao = raw?.missao ? String(raw?.missao).trim() : undefined;

    const existingUsers = await listUsersByNick(n);
    if (existingUsers.some((entry: any) => normalizeHotelCode(entry?.habbo_hotel) === hotelCode)) {
      return NextResponse.json(buildError('Ce pseudo est déjà pris pour cet hôtel.', { code: 'NICK_TAKEN' }), { status: 409 });
    }

    // Ãtape 1: VÃ©rifier l'existence du joueur via Habbo API (minimiser les appels)
    let habboCore: any;
    try {
      habboCore = await getHabboUserByNameForHotel(n, hotelCode);
    } catch (e: any) {
      // 404 ou autre -> on bloque l'inscription si le pseudo n'existe pas cÃ´tÃ© Habbo
      const msg = e?.message || '';
      const notFound = /404/.test(msg);
      return NextResponse.json(
        buildError(notFound ? "Ce pseudo n'existe pas sur Habbo." : 'VÃ©rification Habbo indisponible, rÃ©essayez plus tard.', { code: notFound ? 'HABBO_NOT_FOUND' : 'HABBO_UNAVAILABLE' }),
        { status: notFound ? 400 : 502 }
      );
    }

    const verificationCode = generateVerificationCode();
    const verificationExpiresAt = computeVerificationExpiry();
    const expiresDeltaMs = Date.parse(verificationExpiresAt) - Date.now();
    console.info('[register] verification payload', {
      nick: n,
      hotel: hotelCode,
      verificationCode,
      verificationExpiresAt,
      expiresDeltaMs,
      nowIso: new Date().toISOString(),
    });

    // Ãtape 2: CrÃ©er l'utilisateur local
    const user = await createUser({
      nick: n,
      senha: p,
      email: email ?? null,
      missao,
      habboHotel: hotelCode,
      habboUniqueId: habboCore?.uniqueId ? String(habboCore.uniqueId) : null,
      verificationStatus: 'pending',
      verificationCode,
      verificationExpiresAt,
      ativado: 'n',
    });

    try {
      await updateUserVerification(Number((user as any)?.id), {
        habbo_verification_status: 'pending',
        habbo_verification_code: verificationCode,
        habbo_verification_expires_at: verificationExpiresAt,
        habbo_hotel: hotelCode,
        habbo_unique_id: habboCore?.uniqueId ? String(habboCore.uniqueId) : null,
      });
    } catch (patchError) {
      console.warn('[register] verification patch failed', patchError);
    }

    try {
      const stored = await getUserByNick(n, hotelCode);
      console.info('[register] stored record check', {
        nick: n,
        storedCode: stored?.habbo_verification_code ?? null,
        storedExpires: stored?.habbo_verification_expires_at ?? null,
      });
    } catch (logError) {
      console.warn('[register] unable to re-fetch user after creation', logError);
    }

    // Ãtape 3: Stocker un snapshot basique (best-effort, n'Ã©choue pas l'inscription)
    void tryUpdateHabboSnapshotForUser(Number((user as any).id), habboCore);

    return NextResponse.json({
      ok: true,
      id: (user as any).id,
      habboUniqueId: habboCore?.uniqueId ?? null,
      needsVerification: true,
      verification: {
        code: verificationCode,
        expiresAt: verificationExpiresAt,
        hotel: hotelCode,
      },
    });
  } catch (e: any) {
    const message = e?.message || 'Erreur serveur';
    const uniqueNick = /UNIQUE constraint failed|duplicate key value/i.test(message);
    if (uniqueNick) {
      return NextResponse.json(buildError('Ce compte Habbo est dÃ©jÃ  liÃ© Ã  un utilisateur.', { code: 'HABBO_ALREADY_LINKED' }), {
        status: 409,
      });
    }
    return NextResponse.json(buildError(e?.message || 'Erreur serveur', { code: 'SERVER_ERROR' }), { status: 500 });
  }
}
