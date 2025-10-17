import { cn } from "@/lib/utils"

export type ResponsiveGridProps = React.PropsWithChildren<{
  gap?: string
  className?: string
}>

export default function ResponsiveGrid({ children, gap = "gap-4", className }: ResponsiveGridProps) {
  return <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap, className)}>{children}</div>
}

