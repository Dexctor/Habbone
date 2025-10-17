import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/authz';
import { listRoles } from '@/server/directus-service';

const FALLBACK = [
  { name: 'Fondateur', description: 'Tous les accès (site + admin)', adminAccess: true, appAccess: true },
  { name: 'Responsables', description: 'Gérer le site (articles, validations, modération)', adminAccess: true, appAccess: true },
  { name: 'Journalistes', description: 'Créer des articles (validation requise)', adminAccess: false, appAccess: true },
  { name: 'Correcteur', description: 'Corriger/relire les articles (sans publier)', adminAccess: false, appAccess: true },
  { name: 'Constructeurs', description: 'Création de contenus (validation requise)', adminAccess: false, appAccess: true },
  { name: 'Configurateur WIRED', description: 'Contenu WIRED (validation requise)', adminAccess: false, appAccess: true },
  { name: 'Graphistes', description: 'Accès de base + médias', adminAccess: false, appAccess: true },
  { name: 'Animateurs', description: 'Demandes de points (validation responsable/fondateur)', adminAccess: false, appAccess: true },
];

export async function GET() {
  try {
    await assertAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'FORBIDDEN', code: 'FORBIDDEN' }, { status: e?.status || 403 });
  }
  try {
    const rows = await listRoles();
    if (Array.isArray(rows) && rows.length) return NextResponse.json({ data: rows });
  } catch {}
  // Fallback virtual roles (no Directus system access)
  const data = FALLBACK.map((r) => ({
    id: r.name, // use name as id when system roles are unavailable
    name: r.name,
    description: r.description,
    admin_access: r.adminAccess,
    app_access: r.appAccess,
  }));
  return NextResponse.json({ data });
}
