import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const fieldVariants = cva("rounded-md border bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring", {
  variants: {
    tone: {
      primary: "bg-bg-900 border-bg-800",
      secondary: "bg-background border-shadow-100",
      error: "border-red-500 shadow-[0_0_0_2px_hsl(var(--red-500)/0.3)]",
    },
  },
  defaultVariants: { tone: "primary" },
})

type BaseExtra = VariantProps<typeof fieldVariants> & {
  label?: string
  description?: string
}

type InputOnlyProps = Omit<React.ComponentProps<typeof Input>, "size" | "id"> & {
  textarea?: false
  id?: string
}

type TextareaOnlyProps = Omit<React.ComponentProps<typeof Textarea>, "id"> & {
  textarea: true
  id?: string
}

export type TextInputProps = (InputOnlyProps | TextareaOnlyProps) & BaseExtra

export default function TextInput({ label, description, className, tone, textarea, id, ...props }: TextInputProps) {
  const autoId = React.useId()
  const inputId = id ?? autoId
  return (
    <div className="grid gap-1.5">
      {label ? (
        <Label htmlFor={inputId} className="text-sm">
          {label}
        </Label>
      ) : null}
      {textarea ? (
        <Textarea
          id={inputId}
          className={cn(fieldVariants({ tone }), className)}
          {...(props as React.ComponentProps<typeof Textarea>)}
        />
      ) : (
        <Input
          id={inputId}
          className={cn(fieldVariants({ tone }), className)}
          {...(props as React.ComponentProps<typeof Input>)}
        />
      )}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}

