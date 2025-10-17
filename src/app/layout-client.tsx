'use client'

import React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { dur, easings } from '@/lib/motion-tokens'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()

  const transition = { duration: reduce ? dur.xs : dur.md, ease: easings.std as any }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
        transition={transition as any}
        layout
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
