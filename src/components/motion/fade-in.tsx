'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { dur, easings } from '@/lib/motion-tokens'

type AsProp<T extends keyof React.JSX.IntrinsicElements> = {
  as?: T
} & React.ComponentPropsWithoutRef<T>

export default function FadeIn<T extends keyof React.JSX.IntrinsicElements = 'div'>(
  props: AsProp<T> & { delay?: number }
) {
  const { as, className, children, delay = 0, ...rest } = props as AsProp<T> & { delay?: number }
  const reduce = useReducedMotion()

  type MotionTag = keyof typeof motion
  const tag = (as || 'div') as MotionTag
  const Comp = motion[tag] as React.ComponentType<Record<string, unknown>>
  const initial = reduce ? { opacity: 0 } : { opacity: 0, y: 8 }
  const animate = reduce ? { opacity: 1 } : { opacity: 1, y: 0 }

  return (
    <Comp
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: reduce ? dur.xs : dur.sm, ease: easings.std as unknown as number[], delay }}
      className={cn(className)}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </Comp>
  )
}
