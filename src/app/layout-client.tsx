'use client'

import React from 'react'
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { dur, easings } from '@/lib/motion-tokens'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()

  const transition: Partial<Transition> = { duration: reduce ? dur.xs : dur.md, ease: easings.std as unknown as [number, number, number, number] }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
        transition={transition}
        layout
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
