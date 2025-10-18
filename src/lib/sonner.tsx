'use client'

import React from 'react'
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
  success: <CheckCircle2 className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  loading: <Loader2 className="h-5 w-5 animate-spin" />,
}

const toneStyles: Record<Tone, {
  container: string
  icon: string
}> = {
  success: {
    container: 'bg-white border-green-200 text-green-900',
    icon: 'text-green-600',
  },
  error: {
    container: 'bg-white border-red-200 text-red-900',
    icon: 'text-red-600',
  },
  info: {
    container: 'bg-white border-blue-200 text-blue-900',
    icon: 'text-blue-600',
  },
  warning: {
    container: 'bg-white border-amber-200 text-amber-900',
    icon: 'text-amber-600',
  },
  loading: {
    container: 'bg-white border-gray-200 text-gray-900',
    icon: 'text-gray-600',
  },
}

function ModernToast({
  title,
  tone,
  onClose,
}: {
  title: string
  tone: Tone
  onClose: () => void
}) {
  const icon = icons[tone]
  const styles = toneStyles[tone]

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3
        w-full max-w-sm px-4 py-3 rounded-lg
        border shadow-lg ${styles.container}
      `}
      role="status"
      aria-live="polite"
    >
      <div className={`mt-0.5 flex-shrink-0 ${styles.icon}`}>
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed">
          {title}
        </p>
      </div>

      <button
        className="
          flex-shrink-0 rounded-md p-1
          text-gray-400 hover:text-gray-600
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-gray-300
        "
        onClick={onClose}
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

async function modern(message: string, tone: Tone) {
  try {
    const { toast } = await import('sonner')
    toast.custom(
      (t) => (
        <ModernToast
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
  return modern(message, 'success')
}

export async function toastInfo(message: string) {
  return modern(message, 'info')
}

export async function toastError(message: string) {
  return modern(message, 'error')
}

export async function toastWarning(message: string) {
  return modern(message, 'warning')
}

export async function toastLoading(message: string) {
  return modern(message, 'loading')
}