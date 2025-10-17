"use client"
import { Toaster, toast } from "sonner"

export default function ToastProvider() {
  return <Toaster richColors position="top-right" />
}

export const toastSuccess = (message: string) => toast.success(message)
export const toastError = (message: string) => toast.error(message)

