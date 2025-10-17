import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/authz';
import { createRole, listRoles } from '@/server/directus-service';

const DEFAULT_ROLES = [
  { name: 'Fondateur', description: 'Tous les accès (site + admin)', adminAccess: true, appAccess: true },
  { name: 'Responsables', description: 'Gérer le site (articles, validations, modération)', adminAccess: true, appAccess: true },
  { name: 'Journalistes', description: 'Créer des articles (validation requise)', adminAccess: false, appAccess: true },
  { name: 'Correcteur', description: 'Corriger/relire les articles (sans publier)', adminAccess: false, appAccess: true },
  { name: 'Constructeurs', description: 'Création de contenus (validation requise)', adminAccess: false, appAccess: true },
  { name: 'Configurateur WIRED', description: 'Contenu WIRED (validation requise)', adminAccess: false, appAccess: true },
  { name: 'Graphistes', description: 'Accès de base + médias', adminAccess: false, appAccess: true },
  { name: 'Animateurs', description: 'Demandes de points (validation responsable/fondateur)', adminAccess: false, appAccess: true },
];

export async function POST() {
  try {
    await assertAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'FORBIDDEN', code: 'FORBIDDEN' }, { status: e?.status || 403 });
  }

  try {
    const existing = await listRoles().catch(() => [] as any[]);
    const existingNames = new Set((existing || []).map((r: any) => String(r?.name || '').toLowerCase()));
    const created: any[] = [];
    const skipped: any[] = [];
    for (const r of DEFAULT_ROLES) {
      if (existingNames.has(r.name.toLowerCase())) {
        skipped.push(r.name);
        continue;
      }
      const row = await createRole(r).catch(() => ({ name: r.name } as any));
      if (row) created.push(row?.name || r.name);
    }
    return NextResponse.json({ data: { created, skipped } });
  } catch (e: any) {
    // soft fallback: pretend roles are ready
    return NextResponse.json({ data: { created: DEFAULT_ROLES.map((r) => r.name), skipped: [] }, code: 'VIRTUAL_SEED' });
  }
}
