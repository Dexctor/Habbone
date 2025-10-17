"use client";

export default function AdminError({ error }: { error: Error & { digest?: string } }) {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Erreur</h1>
      <div className="text-sm text-red-500 border border-red-500/30 rounded p-3 bg-red-500/10">
        {error?.message || 'Une erreur est survenue.'}
      </div>
    </main>
  );
}

