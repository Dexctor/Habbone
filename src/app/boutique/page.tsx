import Link from 'next/link'

export const revalidate = 3600

export default function BoutiquePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col items-center gap-3 text-center text-[color:var(--foreground)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/store.png" alt="Boutique HabbOne" className="h-16 w-16" />
        <h1 className="text-xl font-bold uppercase tracking-[0.08em]">
          Boutique HabbOne
        </h1>
        <p className="text-sm text-[color:var(--foreground)]/70">
          PrÃ©pare-toi Ã  remplir ton sacâ€¦ les travaux avancentÂ !
        </p>
      </header>

      <section className="relative w-full rounded-xl border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/40 px-6 py-12 text-center shadow-[0_24px_70px_-55px_rgba(0,0,0,0.9)]">
        <div className="pointer-events-none absolute -top-12 left-1/2 h-16 w-16 -translate-x-1/2 rotate-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/coin-mini.png" alt="" className="h-full w-full" />
        </div>
        <div className="pointer-events-none absolute -bottom-12 left-10 h-14 w-14 -rotate-6 opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/joystick.png" alt="" className="h-full w-full" />
        </div>
        <div className="pointer-events-none absolute -bottom-14 right-6 h-16 w-16 rotate-6 opacity-75">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/badges.png" alt="" className="h-full w-full" />
        </div>

        <div className="space-y-4">
          <p className="text-lg font-bold uppercase tracking-[0.12em] text-[color:var(--foreground)]/80">
            Coming Soon
          </p>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/80">
            La boutique est en construction par nos ouvriers Habbo. Reviens bientÃ´t pour dÃ©couvrir packs, badges exclusifs et surprises inÃ©ditesÂ !
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 text-sm text-[color:var(--foreground)]/70">
          <span className="uppercase tracking-[0.08em] text-[color:var(--foreground)]/55">
            Pendant ce tempsâ€¦
          </span>
          <Link
            href="/partenaires"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--bg-600)]/60 bg-[color:var(--bg-800)]/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--foreground)]/80 transition hover:border-[color:var(--bg-500)]/70 hover:text-[color:var(--foreground)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/earth.png" alt="" className="h-5 w-5" />
            Explorer nos partenaires
          </Link>
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-900)]/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--foreground)]/80 transition hover:border-[color:var(--bg-500)]/60 hover:text-[color:var(--foreground)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/forum.png" alt="" className="h-5 w-5" />
            Discuter sur le forum
          </Link>
        </div>
      </section>

      <footer className="text-xs text-[color:var(--foreground)]/55">
        Tu as une idÃ©e pour la boutiqueÂ ? Passe nous voir sur le forum ou le Discord pour en discuter.
      </footer>
    </main>
  )
}
