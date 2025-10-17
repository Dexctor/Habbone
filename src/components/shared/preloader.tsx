"use client"
import React from "react"

export type PreloaderProps = {
  show: boolean
  label?: string
}

export default function Preloader({ show, label = "Chargement..." }: PreloaderProps) {
  if (!show) return null
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

