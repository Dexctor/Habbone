import { cn } from "@/lib/utils"

export type BoxAllProps = React.PropsWithChildren<{
  className?: string
  title?: string
}>

export default function BoxAll({ children, className, title }: BoxAllProps) {
  return (
    <section className={cn("rounded-md border bg-card text-card-foreground shadow-sm", className)}>
      {title ? <div className="border-b px-4 py-2 text-sm font-medium">{title}</div> : null}
      <div className="p-4">{children}</div>
    </section>
  )
}

