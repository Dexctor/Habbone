import { NextResponse } from 'next/server'
import { VerificationRegenerateSchema, formatZodError, buildError } from '@/types/api'
import { getUserByNick, updateUserVerification } from '@/server/directus-service'
import { computeVerificationExpiry, generateVerificationCode } from '@/lib/verification'

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => ({}))
    const parsed = VerificationRegenerateSchema.safeParse({
      nick: raw?.nick,
    })
    if (!parsed.success) {
      return NextResponse.json(
        buildError('Erreur de validation', {
          code: 'VALIDATION_ERROR',
          fields: formatZodError(parsed.error).fieldErrors,
        }),
        { status: 400 },
      )
    }

    const { nick } = parsed.data
    const user = await getUserByNick(nick)
    if (!user) {
      return NextResponse.json(buildError('Utilisateur introuvable', { code: 'NOT_FOUND' }), { status: 404 })
    }

    const status = String((user as any)?.habbo_verification_status || '')
    if (status === 'locked') {
      return NextResponse.json(buildError('Vérification verrouillée.', { code: 'LOCKED' }), { status: 423 })
    }
    if (status === 'ok') {
      return NextResponse.json({ ok: true, code: null, expiresAt: null, alreadyVerified: true })
    }

    const code = generateVerificationCode()
    const expiresAt = computeVerificationExpiry()
    console.info('[verify/regenerate] new code', {
      nick,
      code,
      expiresAt,
      deltaMs: Date.parse(expiresAt) - Date.now(),
      nowIso: new Date().toISOString(),
    })

    await updateUserVerification(Number((user as any).id), {
      habbo_verification_status: 'pending',
      habbo_verification_code: code,
      habbo_verification_expires_at: expiresAt,
    })

    return NextResponse.json({
      ok: true,
      code,
      expiresAt,
    })
  } catch (error: any) {
    return NextResponse.json(
      buildError(error?.message || 'Erreur serveur', { code: 'SERVER_ERROR' }),
      { status: 500 },
    )
  }
}
