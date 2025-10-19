import React from "react"

import { cn } from "@/lib/utils"

export type PageHeroProps = {
  icon?: React.ReactNode
  kicker?: string
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHero({
  icon,
  kicker,
  title,
  description,
  actions,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-900)]/45 px-6 py-6 shadow-[0_30px_70px_-60px_rgba(0,0,0,0.8)] sm:px-8",
        className
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4 text-[color:var(--foreground)]">
          {icon ? (
            <div className="flex h-12 w-12 items-center justify-center bg-[color:var(--bg-700)]/70 text-[color:var(--foreground)]">
              {icon}
            </div>
          ) : null}
          <div className="space-y-2">
            {kicker ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground)]/55">
                {kicker}
              </p>
            ) : null}
            <h1 className="text-lg font-bold uppercase tracking-[0.24em] text-[color:var(--foreground)]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm text-[color:var(--foreground)]/65">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="w-full sm:w-auto">{actions}</div> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  )
}
