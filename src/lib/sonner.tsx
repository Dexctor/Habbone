'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react'

type Tone = 'success' | 'error' | 'info' | 'warning' | 'loading'

const icons: Record<Tone, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-300" />,
  error: <XCircle className="h-5 w-5 text-red-300" />,
  info: <Info className="h-5 w-5 text-sky-300" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-300" />,
  loading: <Loader2 className="h-5 w-5 text-purple-300 animate-spin" />,
}

const toneStyles: Record<Tone, {
  container: string
  stripe: string
  title: string
  shadow: string
}> = {
  success: {
    container: 'bg-[#17271e] border-[rgba(53,223,143,0.65)]',
    stripe: 'rgba(53,223,143,0.35), rgba(53,223,143,0.05), rgba(53,223,143,0)',
    title: 'text-[#9ff4c9]',
    shadow: 'shadow-[0_12px_28px_-18px_rgba(53,223,143,0.65)]'
  },
  error: {
    container: 'bg-[#2a1c1c] border-[rgba(248,113,113,0.65)]',
    stripe: 'rgba(248,113,113,0.35), rgba(248,113,113,0.05), rgba(248,113,113,0)',
    title: 'text-[#fda4af]',
    shadow: 'shadow-[0_12px_28px_-18px_rgba(248,113,113,0.65)]'
  },
  info: {
    container: 'bg-[#1a2433] border-[rgba(96,165,250,0.65)]',
    stripe: 'rgba(96,165,250,0.35), rgba(96,165,250,0.05), rgba(96,165,250,0)',
    title: 'text-[#bfdbfe]',
    shadow: 'shadow-[0_12px_28px_-18px_rgba(96,165,250,0.65)]'
  },
  warning: {
    container: 'bg-[#2b2514] border-[rgba(251,191,36,0.65)]',
    stripe: 'rgba(251,191,36,0.35), rgba(251,191,36,0.05), rgba(251,191,36,0)',
    title: 'text-[#fde68a]',
    shadow: 'shadow-[0_12px_28px_-18px_rgba(251,191,36,0.65)]'
  },
  loading: {
    container: 'bg-[#241c32] border-[rgba(192,132,252,0.65)]',
    stripe: 'rgba(192,132,252,0.35), rgba(192,132,252,0.05), rgba(192,132,252,0)',
    title: 'text-[#e9d5ff]',
    shadow: 'shadow-[0_12px_28px_-18px_rgba(192,132,252,0.65)]'
  },
}

function GlassToast({
  title,
  tone,
  onClose,
  index = 0
}: {
  title: string
  tone: Tone
  onClose: () => void
  index?: number
}) {
  const icon = icons[tone]
  const styles = toneStyles[tone]

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0.85,
        y: -20,
        x: 50
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: index * 8, // Effet de pile avec dÃ©calage
        x: 0
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.9,
        x: 100,
        y: -10
      }}
      transition={{
        type: "spring",
        duration: 0.5,
        bounce: 0.3,
        stiffness: 200,
        damping: 20
      }}
      whileHover={{ 
        scale: 1.02,
        y: index * 8 - 2
      }}
      className={`
        relative pointer-events-auto flex items-start justify-between gap-3
        w-full max-w-sm min-h-[64px] h-auto px-4 py-3 rounded-[10px]
        border-2 ${styles.container} ${styles.shadow}
        text-white/95 group
        shadow-[0_2px_0_rgba(0,0,0,0.45),0_8px_18px_rgba(0,0,0,0.45)]
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 35%, rgba(255,255,255,0) 100%)',
        zIndex: 1000 - index
      }}
      role="status"
      aria-live="polite"
    >
      {/* Effet de brillance */}
      <motion.div
        className="absolute inset-0 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(120deg, ${styles.stripe})`
        }}
      />

      <div className="flex items-start gap-3 min-w-0 flex-1 pt-1 relative z-10">
        <span className="mt-0.5 flex-shrink-0 rounded-[4px] bg-black/20 p-1 shadow-[0_2px_0_rgba(0,0,0,0.45)]">
          {icon}
        </span>
        <span className={`text-sm font-semibold uppercase tracking-[0.04em] opacity-95 whitespace-normal break-words leading-relaxed drop-shadow-sm flex-1 ${styles.title}`}>
          {title}
        </span>
      </div>

      <motion.button
        className="
          border-0 rounded-xl bg-white/10 backdrop-blur-sm
          text-white/80 text-xs cursor-pointer p-2
          transition-all duration-200 ease-out
          border border-white/15 flex-shrink-0 self-start
          hover:bg-white/20 hover:text-white hover:border-white/25
          active:bg-white/30
          relative z-10
          w-7 h-7 flex items-center justify-center
        "
        onClick={onClose}
        aria-label="Fermer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
      >
        <X className="h-4 w-4" />
      </motion.button>
    </motion.div>
  )
}

async function glass(message: string, tone: Tone) {
  try {
    const { toast } = await import('sonner')
    toast.custom(
      (t) => (
        <GlassToast
          title={message}
          tone={tone}
          onClose={() => toast.dismiss(t)}
        />
      ),
      { 
        duration: tone === 'loading' ? Infinity : 4000,
        position: 'top-right'
      }
    )
  } catch (error) {
    console.error('Error showing toast:', error)
  }
}

export async function toastSuccess(message: string) {
  return glass(message, 'success')
}

export async function toastInfo(message: string) {
  return glass(message, 'info')
}

export async function toastError(message: string) {
  return glass(message, 'error')
}

export async function toastWarning(message: string) {
  return glass(message, 'warning')
}

export async function toastLoading(message: string) {
  return glass(message, 'loading')
}






