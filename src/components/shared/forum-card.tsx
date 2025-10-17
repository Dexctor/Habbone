import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

export type ForumCardProps = {
  title: string
  author: string
  thumb?: string
  href: string
}

export default function ForumCard({ title, author, thumb, href }: ForumCardProps) {
  return (
    <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="transition-colors hover:bg-bg-500/50">
        <CardContent className="flex items-center gap-3 p-3">
          {thumb ? (
            <div className="relative h-16 w-16 overflow-hidden rounded bg-muted">
              <Image src={thumb} alt="topic" fill className="object-cover" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded bg-muted" />
          )}
          <div className="min-w-0">
            <div className="truncate font-medium">{title}</div>
            <div className="truncate text-xs text-muted-foreground">{author}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

