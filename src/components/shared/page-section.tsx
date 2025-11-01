import React from "react"

import { cn } from "@/lib/utils"

export type PageSectionProps = {
  title?: React.ReactNode
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  titleClassName?: string
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  titleClassName,
}: PageSectionProps) {
  const hasHeader = Boolean(title || description || actions)

  return (
    <section
      className={cn(
        "",
        className
      )}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-3 border-b border-[color:var(--bg-700)]/45  sm:flex-row sm:items-center sm:justify-between bg-[#1F1F3E] pr-5.5 ">
          <div className="space-y-1 px-6 py-5 sm:px-8">
            {title ? (
              <h2 className={cn("text-xl font-semibold uppercase text-[color:var(--foreground)]", titleClassName)}>
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
