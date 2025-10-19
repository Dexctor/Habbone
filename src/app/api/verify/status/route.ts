import { NextResponse } from 'next/server'
import { VerificationStatusSchema, formatZodError, buildError } from '@/types/api'
import {
  listUsersByNick,
  markUserAsVerified,
  normalizeHotelCode,
  updateUserVerification,
} from '@/server/directus-service'
import { getHabboUserByIdForHotel, getHabboUserByNameForHotel } from '@/lib/habbo'
import { isVerificationExpired } from '@/lib/verification'

const ERROR_NOT_FOUND = buildError('Utilisateur introuvable', { code: 'NOT_FOUND' })

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => ({}))
    const parsed = VerificationStatusSchema.safeParse({
      nick: raw?.nick,
      code: raw?.code,
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
    const { nick, code } = parsed.data
    console.info('[verify/status] request', { nick, code })

    const users = await listUsersByNick(nick)
    if (!users.length) {
      console.warn('[verify/status] user not found', { nick })
      return NextResponse.json(ERROR_NOT_FOUND, { status: 404 })
    }

    const lowerCode = String(code || '').toLowerCase()
    const user =
      users.length === 1
        ? users[0]
        : users.find((entry: any) => String((entry as any)?.habbo_verification_code || '').toLowerCase() === lowerCode) ??
          users[0]

    const id = Number((user as any)?.id ?? 0)
    const status = String((user as any)?.habbo_verification_status || '')
    const storedCode = String((user as any)?.habbo_verification_code || '')
    const expiresAt = (user as any)?.habbo_verification_expires_at as string | null | undefined
    const hotel = normalizeHotelCode((user as any)?.habbo_hotel)
    let uniqueId = String((user as any)?.habbo_unique_id || '')

    console.info('[verify/status] user state', {
      nick,
      status,
      storedCode,
      expiresAt,
      hotel,
      uniqueId,
    })

    if (status === 'locked') {
      console.warn('[verify/status] locked', { nick });
      return NextResponse.json(buildError('Vérification verrouillée.', { code: 'LOCKED' }), { status: 423 })
    }

    if (status === 'ok') {
      console.info('[verify/status] already verified', { nick })
      return NextResponse.json({ verified: true, status })
    }

    if (!storedCode) {
      console.warn('[verify/status] code missing', { nick })
      return NextResponse.json(
        buildError('Code de vérification absent, veuillez en générer un nouveau.', { code: 'CODE_MISSING' }),
        { status: 409 },
      )
    }

    if (storedCode !== code) {
      console.warn('[verify/status] code mismatch', { nick, expected: storedCode, received: code })
      return NextResponse.json(buildError('Code invalide.', { code: 'CODE_MISMATCH' }), { status: 403 })
    }

    const normalizedExpiresAt = expiresAt && (expiresAt.endsWith('Z') || /[+-]\d\d:?\d\d$/.test(expiresAt) ? expiresAt : `${expiresAt}Z`)
    const expiresAtMs = normalizedExpiresAt ? Date.parse(normalizedExpiresAt) : null
    console.info('[verify/status] expires delta', {
      nick,
      expiresAt,
      normalizedExpiresAt,
      expiresAtMs,
      deltaMs: expiresAtMs ? expiresAtMs - Date.now() : null,
      nowIso: new Date().toISOString(),
    })

    if (isVerificationExpired(expiresAt)) {
      console.warn('[verify/status] code expired', { nick, expiresAt })
      void updateUserVerification(id, {
        habbo_verification_status: 'failed',
        habbo_verification_code: null,
        habbo_verification_expires_at: null,
      })
      return NextResponse.json(buildError('Code expiré.', { code: 'CODE_EXPIRED' }), { status: 410 })
    }

    const nickname = String(user?.nick || nick)
    let profile: any = null

    if (uniqueId) {
      try {
        profile = await getHabboUserByIdForHotel(uniqueId, hotel)
      } catch (err: any) {
        const message = err?.message || ''
        if (/404/.test(message)) {
          uniqueId = ''
        } else {
          throw err
        }
      }
    }

    if (!profile) {
      console.info('[verify/status] fetching profile by name', { nick, nickname, hotel })
      profile = await getHabboUserByNameForHotel(nickname, hotel)
      uniqueId = profile?.uniqueId || uniqueId
      if (uniqueId) {
        console.info('[verify/status] resolved uniqueId from name', { nick, uniqueId })
        void updateUserVerification(id, { habbo_unique_id: uniqueId })
      }
    }

    const motto = String(profile?.motto || profile?.mission || '')

    const contains = !!motto && motto.toUpperCase().includes(storedCode.toUpperCase())
    console.info('[verify/status] motto check', {
      nick,
      hotel,
      storedCode,
      mottoSnippet: motto ? motto.slice(0, 120) : '',
      contains,
    })

    if (!contains) {
      return NextResponse.json({ verified: false, status: 'pending' })
    }

    await markUserAsVerified(id)
    console.info('[verify/status] verification success', { nick, hotel })
    return NextResponse.json({ verified: true, status: 'ok' })
  } catch (error: any) {
    console.error('[verify/status] server error', error)
    return NextResponse.json(
      buildError(error?.message || 'Erreur serveur', { code: 'SERVER_ERROR' }),
      { status: 500 },
    )
  }
}
