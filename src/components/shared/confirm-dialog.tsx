"use client"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type ConfirmDialogProps = {
  open?: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export default function ConfirmDialog({
  open: controlledOpen,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState<boolean>(!!controlledOpen)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); onCancel?.() }}>{cancelLabel}</Button>
          <Button onClick={() => { setOpen(false); onConfirm?.() }}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

