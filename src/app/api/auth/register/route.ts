// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { createUser, getUserByNick } from '@/server/directus-service'
import { RegisterBodySchema, formatZodError, buildError } from '@/types/api'

export async function POST(req: Request) {
  try {
    let body: any = null
    const type = req.headers.get('content-type') || ''
    if (type.includes('application/json')) {
      body = await req.json()
    } else if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      const fd = await req.formData()
      body = Object.fromEntries(fd.entries())
    } else {
      body = await req.json().catch(async () => {
        const fd = await req.formData().catch(() => null)
        return fd ? Object.fromEntries(fd.entries()) : {}
      })
    }

    const input = {
      nick: String((body?.nick ?? body?.username ?? body?.pseudo ?? body?.Nick ?? '')).trim(),
      password: String((body?.password ?? body?.pass ?? '')).toString(),
      email: body?.email ? String(body?.email).trim() : undefined,
    }
    const parsed = RegisterBodySchema.safeParse(input)
    if (!parsed.success) {
      return NextResponse.json(
        buildError('Erreur de validation', { code: 'VALIDATION_ERROR', fields: formatZodError(parsed.error).fieldErrors }),
        { status: 400 }
      )
    }
    const { nick, password, email } = parsed.data

    const existing = await getUserByNick(nick).catch(() => null)
    if (existing) {
      return NextResponse.json(buildError('Ce pseudo est déjà utilisé.', { code: 'NICK_TAKEN' }), { status: 409 })
    }

    await createUser({ nick, senha: password, email: email ?? null })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(buildError('Erreur serveur', { code: 'SERVER_ERROR' }), { status: 500 })
  }
}

