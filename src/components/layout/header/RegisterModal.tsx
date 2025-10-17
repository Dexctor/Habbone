'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toastError, toastSuccess } from '@/lib/sonner'

type RegisterModalProps = {
  open: boolean
  onClose: () => void
}

export default function RegisterModal({ open, onClose }: RegisterModalProps) {
  const [nick, setNick] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setNick('')
      setEmail('')
      setPassword('')
      setSubmitting(false)
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      const payload = {
        nick: nick.trim(),
        password,
        email: email.trim() || undefined,
      }
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = (json as any)?.error || 'Inscription impossible pour le moment.'
        try { await toastError(message) } catch {}
        return
      }
      try { await toastSuccess('Compte cree. Vous pouvez vous connecter.') } catch {}
      onClose()
    } catch (error: any) {
      try { await toastError(error?.message || "Erreur lors de l'inscription.") } catch {}
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose() }}>
      <DialogContent className="bg-[#25254D] border-[#141433] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white uppercase tracking-wide text-base">Inscription</DialogTitle>
          <DialogDescription className="text-sm text-[#BEBECE]">
            Cree ton compte HabbOne en quelques secondes.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            name="nick"
            placeholder="Pseudo Habbo"
            value={nick}
            onChange={(event) => setNick(event.target.value)}
            required
            minLength={3}
            maxLength={20}
            autoComplete="username"
            className="bg-[#141433] border-[#1F1F3E] text-[#BEBECE] placeholder:text-[#7D7D9E]"
          />
          <Input
            name="email"
            type="email"
            placeholder="Email (optionnel)"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="bg-[#141433] border-[#1F1F3E] text-[#BEBECE] placeholder:text-[#7D7D9E]"
          />
          <Input
            name="password"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="bg-[#141433] border-[#1F1F3E] text-[#BEBECE] placeholder:text-[#7D7D9E]"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
              className="text-[#BEBECE] hover:text-white hover:bg-[#1F1F3E]"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting} className="bg-[#0FD52F] text-black hover:brightness-90">
              {submitting ? 'Creation...' : 'Creer mon compte'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
