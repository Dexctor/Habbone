import { NextResponse } from 'next/server'

import { buildError, formatZodError, VerificationRegenerateSchema } from '@/types/api'
import {
  getUserByNick,
  listUsersByNick,
  normalizeHotelCode,
  updateUserVerification,
} from '@/server/directus-service'
import { computeVerificationExpiry, generateVerificationCode } from '@/lib/verification'

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => ({}))
    const parsed = VerificationRegenerateSchema.safeParse({
      nick: raw?.nick,
      hotel: raw?.hotel,
    })

    if (!parsed.success) {
      return NextResponse.json(
        buildError('Erreur de validation', {
          code: 'VALIDATION_ERROR',
          fields: formatZodError(parsed.error).fieldErrors,
        }),
        { status: 400 }
      )
    }

    const { nick, hotel } = parsed.data
    const hotelCode = hotel ? normalizeHotelCode(hotel) : null

    let user: any = null

    if (hotelCode) {
      user = await getUserByNick(nick, hotelCode)
    } else {
      const users = await listUsersByNick(nick)
      if (!users.length) {
        return NextResponse.json(buildError('Utilisateur introuvable', { code: 'NOT_FOUND' }), {
          status: 404,
        })
      }
      if (users.length > 1) {
        return NextResponse.json(
          buildError("Plusieurs comptes existent pour ce pseudo, precise l'hotel.", {
            code: 'HOTEL_REQUIRED',
          }),
          { status: 409 }
        )
      }
      user = users[0]
    }

    if (!user) {
      return NextResponse.json(buildError('Utilisateur introuvable', { code: 'NOT_FOUND' }), {
        status: 404,
      })
    }

    const status = String((user as any)?.habbo_verification_status || '')
    if (status === 'locked') {
      return NextResponse.json(buildError('Verification verrouillee.', { code: 'LOCKED' }), {
        status: 423,
      })
    }
    if (status === 'ok') {
      return NextResponse.json({ ok: true, code: null, expiresAt: null, alreadyVerified: true })
    }

    const code = generateVerificationCode()
    const expiresAt = computeVerificationExpiry()

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
      { status: 500 }
    )
  }
}

