import { ReactNode } from "react"

export type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center">
      {icon ? <div className="mb-1 text-muted-foreground">{icon}</div> : null}
      <div className="font-medium">{title}</div>
      {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
    </div>
  )
}

