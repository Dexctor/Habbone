'use client'

import React from 'react'

export default function SonnerClient() {
  const [Mod, setMod] = React.useState<any>(null)

  React.useEffect(() => {
    let mounted = true
    import('sonner')
      .then((m) => {
        if (mounted) setMod(m)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  if (!Mod?.Toaster) return null
  const Toaster = Mod.Toaster
  return <Toaster richColors position="top-right" />
}

