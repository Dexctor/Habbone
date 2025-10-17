import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth';
import ProfileClient from '@/components/profile/ProfileClient';

export const revalidate = 0;

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?from=/profile');
  }

  const user = session.user as any;
  const nick = user?.nick ?? 'Utilisateur';
  const avatar = user?.avatar as string | null;
  const missao = user?.missao as string | null;

  return (
    <main className="max-w-[1320px] mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">MON PROFIL</h1>


      <section className="space-y-4">
        <ProfileClient nick={nick} />
      </section>
    </main>
  );
}
