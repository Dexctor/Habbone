"use client"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import TagPill from "./tag-pill"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type NewsCardProps = {
  title: string
  tag: "novidade" | "habbone" | "raros" | "default"
  excerpt: string
  imageUrl?: string
  href: string
  event?: boolean
}

export default function NewsCard({ title, tag, excerpt, imageUrl, href }: NewsCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Card className="overflow-hidden border-border bg-card">
          {imageUrl ? (
            <div className="relative h-40 w-full">
              <Image src={imageUrl} alt="news thumbnail" fill className="object-cover" />
              <div className="absolute left-2 top-2">
                <TagPill tone={tag} variant="header">{tag}</TagPill>
              </div>
            </div>
          ) : null}
          <CardHeader>
            <CardTitle className="line-clamp-2 text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground line-clamp-3">{excerpt}</CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

