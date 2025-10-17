import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow hover:bg-blue-300/80 active:bg-blue-700/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:text-primary hover:bg-secondary/80",
        link: "border border-shadow-200 hover:border-blue-500 text-foreground bg-transparent",
        info: "border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-primary-foreground",
        success: "bg-green-500 text-foreground hover:opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        ghost: "hover:bg-muted",
        outline: "border border-border bg-transparent hover:bg-muted",
      },
      size: {
        xs2: "h-[45px] px-3",
        sm: "h-[50px] px-3 max-w-[142px]",
        md: "h-[50px] px-4",
        arrow: "h-[50px] w-[50px] p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export default function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

