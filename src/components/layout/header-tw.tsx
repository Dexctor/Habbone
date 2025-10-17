'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { dur, easings } from '@/lib/motion-tokens'
import { toastError, toastSuccess } from '@/lib/sonner'
import TopBar from './header/TopBar'
import Banner from './header/Banner'
import UserBarLeft from './header/UserBarLeft'
import BadgesSlider from './header/BadgesSlider'
import RegisterModal from './header/RegisterModal'
import MobileMenu from './header/MobileMenu'
import StoryUploadModal from './header/StoryUploadModal'

type LoginPayload = {
  nick: string
  password: string
}

export default function HeaderTW() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [storyOpen, setStoryOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession()
  const pathname = usePathname() || ''
  const router = useRouter()
  const [level, setLevel] = useState<number | null>(null)
  const [coins, setCoins] = useState<number | null>(null)
  const reduce = useReducedMotion()
  const fast = useMemo(() => ({ duration: reduce ? dur.xs : dur.sm, ease: easings.std as any }), [reduce])
  const slow = useMemo(() => ({ duration: reduce ? dur.xs : dur.lg, ease: easings.emph as any }), [reduce])
  const menuRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (menuOpen) {
      try { document.body.classList.add('overflow-hidden') } catch {}
    } else {
      try { document.body.classList.remove('overflow-hidden') } catch {}
    }
    return () => { try { document.body.classList.remove('overflow-hidden') } catch {} }
  }, [menuOpen])

  useEffect(() => {
    if (!storyOpen) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setStoryOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [storyOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
      if (event.key === 'Tab' && menuRef.current) {
        const focusables = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
        const list = Array.from(focusables).filter(el => el.offsetParent !== null)
        if (list.length === 0) return
        const first = list[0]
        const last = list[list.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (event.shiftKey) {
          if (active === first) { event.preventDefault(); last.focus() }
        } else if (active === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    const timer = window.setTimeout(() => { try { closeBtnRef.current?.focus() } catch {} }, 0)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  useEffect(() => {
    const nick = (session?.user as any)?.nick as string | undefined
    if (status !== 'authenticated' || !nick) return
    let cancelled = false

    const onProfilePage = pathname.startsWith('/profile')
    if (onProfilePage && typeof window !== 'undefined') {
      try {
        const fromWindow: any = (window as any).__habboProfile
        const lvl = (fromWindow?.user?.currentLevel ?? fromWindow?.profile?.currentLevel ?? (window as any).__habboLevel ?? null)
        if (typeof lvl === 'number') setLevel(lvl)
      } catch {}
      const handler = (event: any) => {
        if (cancelled) return
        try {
          const detail = event?.detail
          const lvl = (detail?.user?.currentLevel ?? detail?.profile?.currentLevel ?? null)
          setLevel(typeof lvl === 'number' ? lvl : null)
        } catch {}
      }
      window.addEventListener('habbo:profile', handler as any)
      ;(async () => {
        try {
          const response = await fetch('/api/user/moedas', { cache: 'no-store' })
          const payload = await response.json().catch(() => null)
          if (!cancelled && response.ok) {
            const value = typeof payload?.moedas === 'number' ? payload.moedas : Number(payload?.moedas || 0)
            setCoins(Number.isFinite(value) ? value : null)
          }
        } catch {}
      })()
      return () => {
        cancelled = true
        try { window.removeEventListener('habbo:profile', handler as any) } catch {}
      }
    }

    ;(async () => {
      try {
        const response = await fetch(`/api/habbo/profile?name=${encodeURIComponent(nick)}&lite=1`, { cache: 'no-store' })
        const payload: any = await response.json().catch(() => null)
        if (!cancelled && response.ok) {
          const lvl = (payload?.user?.currentLevel ?? payload?.profile?.currentLevel ?? null)
          setLevel(typeof lvl === 'number' ? lvl : null)
        }
      } catch {}
      try {
        const response = await fetch('/api/user/moedas', { cache: 'no-store' })
        const payload = await response.json().catch(() => null)
        if (!cancelled && response.ok) {
          const value = typeof payload?.moedas === 'number' ? payload.moedas : Number(payload?.moedas || 0)
          setCoins(Number.isFinite(value) ? value : null)
        }
      } catch {}
    })()

    return () => { cancelled = true }
  }, [status, session?.user, pathname])

  const handleLogin = useCallback(async ({ nick, password }: LoginPayload) => {
    const trimmedNick = nick.trim()
    if (!trimmedNick || !password) {
      try { await toastError('Veuillez saisir votre pseudo et votre mot de passe.') } catch {}
      return false
    }
    try {
      const check = await fetch(`/api/auth/check-user?nick=${encodeURIComponent(trimmedNick)}`, { cache: 'no-store' })
      const payload = await check.json().catch(() => ({}))
      if (!check.ok || !payload?.exists) {
        try { await toastError('Utilisateur inexistant.') } catch {}
        return false
      }
    } catch {
      try { await toastError('Verification impossible pour le moment.') } catch {}
      return false
    }

    try {
      const result = await signIn('credentials', { nick: trimmedNick, password, redirect: false })
      if (result?.error) {
        try { await toastError('Mot de passe incorrect.') } catch {}
        return false
      }
      try { await toastSuccess('Connexion reussie. Bienvenue !') } catch {}
      router.push('/profile')
      router.refresh()
      return true
    } catch {
      try { await toastError('Erreur lors de la connexion.') } catch {}
      return false
    }
  }, [router])

  const handleLogout = useCallback(async () => {
    try { await toastSuccess('Deconnexion effectuee.') } catch {}
    try { await signOut({ callbackUrl: '/' }) } catch {}
  }, [])

  const openRegister = useCallback(() => setRegisterOpen(true), [])
  const closeRegister = useCallback(() => setRegisterOpen(false), [])

  return (
    <header className="header w-full min-h-[90vh]" suppressHydrationWarning>
      <TopBar reduce={reduce} fast={fast} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Banner slow={slow} />

      <motion.section
        layout
        className="userbar w-full min-h-[16vh] bg-[#25254D] shadow-[0_-1px_0_rgba(255,255,255,.1),_0_1px_0_#141433]"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
        whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
        transition={fast as any}
      >
        <div className="container max-w-[1200px] mx-auto px-4">
          <div className="row flex flex-wrap">
            <div className="col-md-8 col-12 w-full lg:w-2/3">
              <UserBarLeft
                mounted={mounted}
                status={status as any}
                session={session as any}
                level={level}
                coins={coins}
                onOpenStory={() => setStoryOpen(true)}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onRequestRegister={openRegister}
              />
            </div>
            <BadgesSlider />
          </div>
        </div>
      </motion.section>

      <RegisterModal open={registerOpen} onClose={closeRegister} />

      <MobileMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        pathname={pathname}
        menuRef={menuRef}
        closeBtnRef={closeBtnRef}
      />

      <StoryUploadModal open={storyOpen} onClose={() => setStoryOpen(false)} />
    </header>
  )
}
