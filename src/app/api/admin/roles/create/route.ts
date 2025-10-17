import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertAdmin } from '@/server/authz';
import { createRole } from '@/server/directus-service';

const Body = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  adminAccess: z.boolean().optional(),
  appAccess: z.boolean().optional(),
});

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
  try {
    const row = await createRole(parsed.data);
    return NextResponse.json({ data: row });
  } catch (e: any) {
    // Fallback: return a virtual role using name as id
    const r = parsed.data;
    const data = {
      id: r.name,
      name: r.name,
      description: r.description ?? null,
      admin_access: !!r.adminAccess,
      app_access: r.appAccess ?? true,
    };
    return NextResponse.json({ data, code: 'VIRTUAL_ROLE' });
  }
}
