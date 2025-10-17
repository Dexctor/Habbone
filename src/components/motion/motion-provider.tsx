'use client'

import React from 'react'
import { MotionConfig, useReducedMotion } from 'framer-motion'
import { dur, easings, spring } from '@/lib/motion-tokens'

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  // Respect OS prefers-reduced-motion
  const reduce = useReducedMotion()

  // Default transition tokens
  const transition = reduce
    ? { duration: dur.xs, ease: easings.std as any }
    : { duration: dur.md, ease: easings.emph as any, ...spring.smooth }

  return (
    <MotionConfig reducedMotion="user" transition={transition as any}>
      {children}
    </MotionConfig>
  )
}
