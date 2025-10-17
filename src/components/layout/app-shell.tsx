import React from "react"
import { cn } from "@/lib/utils"

export type AppShellProps = {
  topbar?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export default function AppShell({ topbar, footer, children, className }: AppShellProps) {
  return (
    <div className={cn("min-h-dvh bg-background text-foreground", className)}>
      {topbar}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8 max-w-[1320px]">{children}</main>
      {footer}
    </div>
  )
}

