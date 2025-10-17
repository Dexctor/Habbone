'use client'

import React, { RefObject, useState } from 'react'
import Link from 'next/link'
import { navigation, type NavEntry } from './navigation'

type MobileMenuProps = {
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  pathname: string
  menuRef: RefObject<HTMLDivElement | null>
  closeBtnRef: RefObject<HTMLButtonElement | null>
}

function isPathActive(pathname: string, entry: NavEntry): boolean {
  if (entry.href) {
    if (entry.href === '/') return pathname === '/'
    return pathname === entry.href || pathname.startsWith(`${entry.href}/`)
  }
  if (entry.children) {
    return entry.children.some((child) => isPathActive(pathname, child))
  }
  return false
}

function renderMobileLink(entry: NavEntry, onNavigate: () => void, active: boolean) {
  const base = `block px-3 py-2 rounded transition-colors ${active ? 'bg-[var(--bg-800)] text-white' : 'text-white hover:bg-[var(--bg-800)]'}`

  if (entry.external && entry.href) {
    return (
      <a
        href={entry.href}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
        onClick={onNavigate}
      >
        {entry.label}
      </a>
    )
  }

  if (entry.href) {
    return (
      <Link href={entry.href} className={base} onClick={onNavigate}>
        {entry.label}
      </Link>
    )
  }

  return (
    <span className={`${base} cursor-default`}>
      {entry.label}
    </span>
  )
}

export default function MobileMenu({ menuOpen, setMenuOpen, pathname, menuRef, closeBtnRef }: MobileMenuProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    navigation.forEach((entry) => {
      if (entry.children && entry.children.length > 0) {
        initial[entry.label] = true
      }
    })
    return initial
  })

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleNavigate = () => setMenuOpen(false)

  return (
    <>
      <div
        className={`fixed inset-0 z-[1090] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ease-out lg:hidden ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />

      <div
        id="mobile-nav"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 inset-x-0 z-[1100] lg:hidden bg-[#25254D] border-b border-[#141433] shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="max-w-[1200px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wide">
              <i className="material-icons">menu</i>
              <span>Navigation</span>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              aria-label="Fermer le menu"
              className="rounded-[4px] h-[40px] w-[44px] grid place-items-center text-[#BEBECE] bg-[rgba(255,255,255,.1)] hover:bg-[#2596FF] hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              <i className="material-icons" aria-hidden>close</i>
            </button>
          </div>

          <nav className="mt-3" role="navigation" aria-label="Navigation mobile">
            <ul className="flex flex-col gap-1">
              {navigation.map((entry) => {
                const hasChildren = Boolean(entry.children && entry.children.length > 0)
                const active = isPathActive(pathname, entry)

                if (!hasChildren) {
                  return (
                    <li key={entry.label} className="mt-2">
                      {renderMobileLink(entry, handleNavigate, active)}
                    </li>
                  )
                }

                const open = openSections[entry.label] ?? false

                return (
                  <li key={entry.label} className="mt-2">
                    <button
                      type="button"
                      aria-expanded={open}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[0.75rem] uppercase tracking-wide ${active ? 'text-white' : 'text-[var(--text-500)] hover:text-white'}`}
                      onClick={() => toggleSection(entry.label)}
                    >
                      <span>{entry.label}</span>
                      <i className="material-icons text-white/80">{open ? 'expand_less' : 'expand_more'}</i>
                    </button>
                    <div
                      className={`overflow-hidden transition-[max-height] duration-300 ease-out ${open ? 'max-h-[500px]' : 'max-h-0'}`}
                      aria-hidden={!open}
                    >
                      <ul className="flex flex-col">
                        {entry.children?.map((child) => {
                          const childActive = isPathActive(pathname, child)
                          return (
                            <li key={child.label}>
                              {renderMobileLink(child, handleNavigate, childActive)}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
