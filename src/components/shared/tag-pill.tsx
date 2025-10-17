import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        header: "bg-card text-card-foreground",
      },
      tone: {
        default: "border-border",
        novidade: "bg-blue-500/15 text-blue-500 border-blue-500/30",
        habbone: "bg-violet-500/15 text-violet-400 border-violet-400/30",
        raros: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
      },
      size: {
        sm: "text-[11px]",
        md: "text-xs",
      },
    },
    defaultVariants: { variant: "default", tone: "default", size: "md" },
  }
)

export type TagPillProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tagVariants>

export default function TagPill({ className, variant, tone, size, ...props }: TagPillProps) {
  return <span className={cn(tagVariants({ variant, tone, size }), className)} {...props} />
}

