"use client"
import * as React from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type SearchBarProps = {
  placeholder?: string
  onSubmit?: (value: string) => void
  loading?: boolean
  alert?: { type: "error" | "warning" | "success"; message: string } | null
  className?: string
}

export default function SearchBar({ placeholder = "Rechercher…", onSubmit, loading, alert, className }: SearchBarProps) {
  const [value, setValue] = React.useState("")
  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit?.(value)
        }}
        className="relative"
        role="search"
        aria-label="Recherche"
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="submit"
          aria-label="Rechercher"
          className="absolute inset-y-0 right-0 mr-2 grid place-items-center rounded-md px-2 text-muted-foreground hover:text-blue-500"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
        </button>
      </form>
      {alert ? (
        <div
          role="status"
          className={cn("mt-2 text-sm", {
            "text-red-500": alert.type === "error",
            "text-yellow-500": alert.type === "warning",
            "text-green-500": alert.type === "success",
          })}
        >
          {alert.message}
        </div>
      ) : null}
    </div>
  )
}

