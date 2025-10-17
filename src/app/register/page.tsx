'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [nick, setNick] = useState('');
  const [password, setPassword] = useState('');
  const [missao, setMissao] = useState('Mission Habbo: HabboOneRegister-0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nick: nick.trim(),
          password,
          missao: missao.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || 'Inscription impossible.');
        return;
      }

      // Inscription ok → connexion automatique
      const login = await signIn('credentials', {
        redirect: false,
        nick: nick.trim(),
        password,
      });

      if (login?.error) {
        // Si la connexion auto échoue, rediriger vers /login
        router.push('/login');
        router.refresh();
        return;
      }

      // Succès complet → home
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Créer un compte</h1>

      {error && (
        <div className="text-sm text-red-500 border border-red-500/30 rounded p-3 bg-red-500/10">
          {error}
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
            minLength={3}
            maxLength={20}
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
            minLength={6}
            className="w-full rounded px-3 py-2 bg-transparent border"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="missao" className="text-sm opacity-80">Missao (optionnel)</label>
          <input
            id="missao"
            name="missao"
            type="text"
            value={missao}
            onChange={(e) => setMissao(e.target.value)}
            className="w-full rounded px-3 py-2 bg-transparent border"
            placeholder="Mission Habbo: HabboOneRegister-0"
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded px-4 py-2 bg-white text-black font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Création…' : 'Créer le compte'}
        </button>
      </form>

      <p className="text-sm opacity-80">
        Déjà un compte ?{' '}
        <Link href="/login" className="underline">Se connecter</Link>
      </p>
    </main>
  );
}
