import Link from 'next/link'

const REQUIRED_MARK = ' *'

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-md border border-[color:var(--bg-700)]/65 bg-[color:var(--bg-900)]/45 px-6 py-5 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.85)]">
        <div className="space-y-2 text-[color:var(--foreground)]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--foreground)]/55">
            formulaire habbone
          </p>
          <h1 className="text-lg font-bold uppercase tracking-[0.04em]">
            Une question ? Une demande ? n&apos;hésitez pas !
          </h1>
          <p className="text-xs text-[color:var(--foreground)]/60">
            <span className="font-semibold">*</span> Indique une question obligatoire
          </p>
        </div>
      </header>

      <section className="rounded-md border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/35 px-6 py-8 shadow-[0_24px_60px_-50px_rgba(0,0,0,0.9)]">
        <form className="space-y-6" noValidate>
          <Field
            label="Adresse e-mail"
            name="email"
            type="email"
            placeholder="exemple@habbo.fr"
            required
          />
          <Field
            label="Votre Pseudo Habbo"
            name="pseudo"
            type="text"
            placeholder="Pseudo Habbo"
            required
          />
          <Field
            label="Sujet"
            name="subject"
            type="text"
            placeholder="Sujet de votre demande"
            required
          />
          <Field
            label="Description"
            name="description"
            as="textarea"
            placeholder="Décrivez votre question ou votre besoin..."
            required
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[color:var(--foreground)]/55">
              Nous vous répondrons par e-mail dans les meilleurs délais.
            </p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-[#1d4bff] px-5 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#335bff]"
            >
              Envoyer ma demande
            </button>
          </div>
        </form>
      </section>

      <footer className="rounded-md border border-[color:var(--bg-700)]/45 bg-[color:var(--bg-900)]/25 px-6 py-5 text-sm text-[color:var(--foreground)]/70 shadow-[0_24px_60px_-60px_rgba(0,0,0,0.85)]">
        Besoin d&apos;une réponse immédiate ? Consulte aussi notre{' '}
        <Link href="/forum" className="font-semibold text-[color:var(--foreground)] hover:text-sky-300">
          forum communautaire
        </Link>{' '}
        ou rejoins notre{' '}
        <a
          href="https://discord.gg/zCFvdHsAry"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-sky-400 hover:text-sky-300"
        >
          serveur Discord
        </a>.
      </footer>
    </main>
  )
}

type FieldProps =
  | ({
      label: string
      name: string
      placeholder?: string
      required?: boolean
      className?: string
    } & (
      | { type?: 'text' | 'email'; as?: 'input' }
      | { type?: never; as: 'textarea' }
    ))

function Field(props: FieldProps) {
  const { label, name, placeholder, required, className } = props
  const isTextArea = props.as === 'textarea'
  const inputProps = {
    id: name,
    name,
    placeholder,
    required,
    className:
      'w-full rounded-md border border-[color:var(--bg-700)]/70 bg-[color:var(--bg-900)]/55 px-3 py-3 text-sm text-[color:var(--foreground)] focus:border-[color:var(--bg-300)] focus:outline-none focus:ring-2 focus:ring-[color:var(--bg-300)]/30',
  }

  return (
    <label className={`block space-y-2 text-sm font-medium text-[color:var(--foreground)] ${className ?? ''}`}>
      <span>
        {label}
        {required && <span className="ml-1 text-[color:var(--foreground)]/60">*</span>}
      </span>
      {isTextArea ? (
        <textarea {...inputProps} rows={6} />
      ) : (
        <input {...inputProps} type={props.type ?? 'text'} />
      )}
    </label>
  )
}
