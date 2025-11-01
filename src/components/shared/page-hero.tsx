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
        "border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-900)]/45 px-6 py-4 shadow-[0_30px_70px_-60px_rgba(0,0,0,0.8)] sm:px-8",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-5 sm:gap-6 text-[color:var(--foreground)]">
          {icon ? (
            <div
              className="flex items-center justify-center aspect-square min-w-[clamp(44px,6vw,64px)] min-h-[clamp(44px,6vw,64px)] rounded-sm bg-[color:var(--bg-700)]/70 text-[color:var(--foreground)] p-1.5 sm:p-2 [&>*]:h-[clamp(18px,3.2vw,28px)] [&>*]:w-[clamp(18px,3.2vw,28px)]"
              aria-hidden
            >
              {icon}
            </div>
          ) : null}
          <div className="space-y-2">
            {kicker ? (
              <p className="text-xs font-semibold uppercase text-[color:var(--foreground)]/55">
                {kicker}
              </p>
            ) : null}
            <h1 className="text-lg font-bold uppercase text-[color:var(--foreground)]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-none text-sm text-[color:var(--foreground)]/65">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="w-full sm:w-auto">{actions}</div> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  )
}
