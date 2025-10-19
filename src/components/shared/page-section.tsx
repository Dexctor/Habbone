import React from "react"

import { cn } from "@/lib/utils"

export type PageSectionProps = {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: PageSectionProps) {
  const hasHeader = Boolean(title || description || actions)

  return (
    <section
      className={cn(
        "border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/40 px-6 py-6 shadow-[0_24px_65px_-55px_rgba(0,0,0,0.85)] sm:px-8",
        className
      )}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-3 border-b border-[color:var(--bg-700)]/45 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <h2 className="text-xl font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-xs text-[color:var(--foreground)]/60">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(hasHeader ? "mt-5" : "", contentClassName)}>{children}</div>
    </section>
  )
}
