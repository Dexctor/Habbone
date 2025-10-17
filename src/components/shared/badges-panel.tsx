import Image from "next/image"
import BoxAll from "./box-all"

export type BadgesPanelProps = {
  title?: string
  badges: { id: string; src: string; alt: string }[]
}

export default function BadgesPanel({ title = "Badges", badges }: BadgesPanelProps) {
  return (
    <BoxAll title={title}>
      <div className="scrollbar-thin grid max-h-48 grid-cols-6 gap-2 overflow-y-auto p-1 sm:grid-cols-8 md:grid-cols-10">
        {badges.map((b) => (
          <div key={b.id} className="grid place-items-center rounded bg-muted p-2">
            <Image src={b.src} alt={b.alt} width={32} height={32} className="image-pixelated" />
          </div>
        ))}
      </div>
    </BoxAll>
  )
}

