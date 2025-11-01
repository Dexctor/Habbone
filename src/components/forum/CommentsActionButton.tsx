"use client";

export default function CommentsActionButton({ isAuthenticated }: { isAuthenticated: boolean }) {
  const onClick = () => {
    if (isAuthenticated) {
      window.dispatchEvent(new Event('open-comment-form'))
      const el = document.getElementById('post-comment')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      // no-op: page provides a login link in actions when not auth
    }
  }
  if (!isAuthenticated) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center rounded-md bg-[color:var(--blue-500)] px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-[color:var(--blue-700)]"
    >
      Poster un commentaire
    </button>
  )
}

