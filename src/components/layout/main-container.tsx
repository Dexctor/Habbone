import React from "react"
import { cn } from "@/lib/utils"

export type MainContainerProps = React.PropsWithChildren<{
  className?: string
}>

export default function MainContainer({ children, className }: MainContainerProps) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8", className)}>{children}</div>
}

