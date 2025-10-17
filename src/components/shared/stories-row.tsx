import Image from "next/image"

export type StoriesRowProps = {
  items: { id: string; src: string; alt: string }[]
}

export default function StoriesRow({ items }: StoriesRowProps) {
  return (
    <div className="flex gap-3 overflow-x-auto py-2">
      {items.map((s) => (
        <div key={s.id} className="shrink-0">
          <div className="rounded-full border-2 border-blue-500 p-0.5 transition-transform hover:scale-105">
            <Image src={s.src} alt={s.alt} width={56} height={56} className="rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

