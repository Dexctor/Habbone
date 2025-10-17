'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'
import { AnimatePresence } from 'framer-motion'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <div className="fixed top-0 right-0 z-[100] p-4">
      <AnimatePresence mode="popLayout">
        <Sonner
          theme={theme as ToasterProps['theme']}
          className="toaster group"
          position="top-right"
          expand={false}
          richColors={false}
          offset={0}
          gap={12}
          visibleToasts={5}
          toastOptions={{
            duration: 4000,
            unstyled: true,
            classNames: {
              toast: 'group toast group-[.toaster]:bg-transparent group-[.toaster]:border-none group-[.toaster]:shadow-none group-[.toaster]:pointer-events-auto',
              success: 'group-[.toaster]:bg-transparent group-[.toaster]:border-none group-[.toaster]:shadow-none',
              error: 'group-[.toaster]:bg-transparent group-[.toaster]:border-none group-[.toaster]:shadow-none',
              info: 'group-[.toaster]:bg-transparent group-[.toaster]:border-none group-[.toaster]:shadow-none',
              warning: 'group-[.toaster]:bg-transparent group-[.toaster]:border-none group-[.toaster]:shadow-none',
              loading: 'group-[.toaster]:bg-transparent group-[.toaster]:border-none group-[.toaster]:shadow-none',
              description: 'group-[.toast]:text-muted-foreground',
              actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
              cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground'
            },
            style: {
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: '0',
              margin: '0',
              maxWidth: '420px',
              width: 'auto',
              minWidth: '320px'
            }
          }}
          {...props}
        />
      </AnimatePresence>
    </div>
  )
}

export { Toaster }