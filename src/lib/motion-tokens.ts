export const easings = {
  emph: [0.22, 1, 0.36, 1] as const,
  std: [0.2, 0, 0, 1] as const,
}

export const dur = {
  xs: 0.18,
  sm: 0.25,
  md: 0.35,
  lg: 0.5,
} as const

export const spring = {
  smooth: { type: 'spring', stiffness: 220, damping: 28, mass: 0.9 } as const,
}

export type EasingKey = keyof typeof easings
export type DurationKey = keyof typeof dur
