'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();

  const [nick, setNick] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultError = search.get('error');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        nick,
        password,
      });

      if (!res) {
        setError("Erreur inattendue.");
        return;
      }

      if (res.error) {
        // L'API peut renvoyer des messages précis (ex: compte banni / non activé)
        setError(res.error);
        return;
      }

      // Succès: rediriger où vous voulez (ex: home)
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Se connecter</h1>

      {(error || defaultError) && (
        <div className="text-sm text-red-500 border border-red-500/30 rounded p-3 bg-red-500/10">
          {error || defaultError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="nick" className="text-sm opacity-80">Pseudo Habbo</label>
          <input
            id="nick"
            name="nick"
            type="text"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            required
            className="w-full rounded px-3 py-2 bg-transparent border"
            placeholder="Votre pseudo"
            autoComplete="username"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm opacity-80">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded px-3 py-2 bg-transparent border"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded px-4 py-2 bg-white text-black font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className="text-sm opacity-80">
        Pas de compte ?{' '}
        <Link href="/register" className="underline">Créer un compte</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
