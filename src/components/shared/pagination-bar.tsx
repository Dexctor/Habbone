"use client"
import * as React from "react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export type PaginationBarProps = {
  page: number
  pageCount: number
  onPageChange?: (page: number) => void
}

export default function PaginationBar({ page, pageCount, onPageChange }: PaginationBarProps) {
  const pages = React.useMemo(() => {
    const arr = [] as (number | "ellipsis")[]
    const push = (x: number | "ellipsis") => arr.push(x)
    for (let i = 1; i <= pageCount; i++) {
      if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) push(i)
      else if (arr[arr.length - 1] !== "ellipsis") push("ellipsis")
    }
    return arr
  }, [page, pageCount])

  if (pageCount <= 1) return null

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" aria-label="Précédent" onClick={(e) => { e.preventDefault(); onPageChange?.(Math.max(1, page - 1)) }} />
        </PaginationItem>
        {pages.map((p, idx) => (
          p === "ellipsis" ? (
            <PaginationItem key={`e-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); onPageChange?.(p) }}>
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        ))}
        <PaginationItem>
          <PaginationNext href="#" aria-label="Suivant" onClick={(e) => { e.preventDefault(); onPageChange?.(Math.min(pageCount, page + 1)) }} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

