"use client";

import { Card, CardBody, CardHeader, CardTitle } from "./Card";
import { HabboAvatar } from "./HabboAvatar";
import { motion, useReducedMotion } from "framer-motion";
import type { HabboFriend } from "@/lib/habbo";

type Props = {
  title?: string;
  friends: HabboFriend[];
  totalCount: number;
  visibleCount: number;
  pageSize: number;
  onLoadMore: () => void;
  ariaBusy?: boolean;
};

export function ProfileFriendsList({
  title = 'Amis',
  friends,
  totalCount,
  visibleCount,
  pageSize,
  onLoadMore,
  ariaBusy,
}: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 6 }} animate={reduce ? {} : { opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card aria-busy={ariaBusy}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="max-h-72 overflow-auto rounded-md border border-[color:var(--border)] p-3">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map((f: HabboFriend, idx) => (
                <li key={f?.uniqueId || f?.name || idx} className="flex items-center gap-3 border border-[color:var(--border)] rounded p-2">
                  <HabboAvatar nick={f?.name || f?.habbo || ''} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{f?.name || '–'}</div>
                    {f?.motto && (
                      <div className="text-xs opacity-70 truncate">{f.motto}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {totalCount > visibleCount && (
            <button
              className="mt-2 rounded px-3 py-1 border border-[color:var(--border)] hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              onClick={onLoadMore}
            >
              Charger +{Math.min(pageSize, totalCount - visibleCount)}
            </button>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}

