// app/api/auth/check-user/route.ts
import { NextResponse } from 'next/server'
import { getUserByNick } from '@/server/directus-service'
import { CheckUserQuerySchema, searchParamsToObject, formatZodError, buildError } from '@/types/api'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = CheckUserQuerySchema.safeParse(searchParamsToObject(searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        buildError('Erreur de validation', { code: 'VALIDATION_ERROR', fields: formatZodError(parsed.error).fieldErrors }),
        { status: 400 }
      )
    }

    const { nick } = parsed.data
    const user = await getUserByNick(nick).catch(() => null)
    return NextResponse.json({ ok: true, exists: !!user })
  } catch {
    return NextResponse.json(buildError('Erreur serveur', { code: 'SERVER_ERROR' }), { status: 500 })
  }
}
