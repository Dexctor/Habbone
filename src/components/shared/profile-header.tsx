import Image from "next/image"

export type ProfileHeaderProps = {
  avatarSrc?: string
  nick: string
  level?: number
  counts?: { friends?: number; groups?: number; badges?: number; rooms?: number }
}

export default function ProfileHeader({ avatarSrc = "/img/avatar_empty.png", nick, level, counts }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4 rounded-md border bg-card p-4">
      <div className="relative h-20 w-20 overflow-hidden rounded bg-muted">
        <Image src={avatarSrc} alt={nick} fill className="object-cover image-pixelated" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-lg font-semibold">{nick}</div>
        {typeof level === "number" ? <div className="text-sm text-muted-foreground">Niveau {level}</div> : null}
        {counts ? (
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {counts.friends !== undefined ? <div>Ami·e·s: {counts.friends}</div> : null}
            {counts.groups !== undefined ? <div>Groupes: {counts.groups}</div> : null}
            {counts.badges !== undefined ? <div>Badges: {counts.badges}</div> : null}
            {counts.rooms !== undefined ? <div>Rooms: {counts.rooms}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

