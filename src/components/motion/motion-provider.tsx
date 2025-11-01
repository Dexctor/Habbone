'use client'

import React from 'react'
import { MotionConfig, useReducedMotion, type Transition } from 'framer-motion'
import { dur, easings, spring } from '@/lib/motion-tokens'

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  // Respect OS prefers-reduced-motion
  const reduce = useReducedMotion()

  // Default transition tokens
  const transition: Partial<Transition> = reduce
    ? { duration: dur.xs, ease: easings.std as unknown as [number, number, number, number] }
    : { duration: dur.md, ease: easings.emph as unknown as [number, number, number, number], ...spring.smooth }

  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      {children}
    </MotionConfig>
  )
}
