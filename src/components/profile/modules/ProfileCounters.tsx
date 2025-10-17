"use client";

import { Card, CardBody } from "./Card";

type Counts = {
  friends: number;
  groups: number;
  badges: number;
  rooms: number;
  achievements: number;
  achievementsTotal?: number;
};

export function ProfileCounters({ counts }: { counts: Counts }) {
  const ach = typeof counts.achievementsTotal === 'number' ? counts.achievementsTotal : counts.achievements;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {([
        { label: 'Amis', value: counts.friends },
        { label: 'Groupes', value: counts.groups },
        { label: 'Badges', value: counts.badges },
        { label: 'Rooms', value: counts.rooms },
        { label: 'Achievements', value: ach },
      ] as const).map((it) => (
        <Card key={it.label}>
          <CardBody className="text-center">
            <div className="text-xs opacity-70">{it.label}</div>
            <div className="text-xl font-semibold">{it.value}</div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

