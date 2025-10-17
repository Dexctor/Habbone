import { Skeleton } from "@/components/ui/skeleton"

export default function Loader() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

