"use client";

import { Card, CardBody, CardHeader, CardTitle } from "./Card";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  title?: string;
  groups: any[];
  totalCount: number;
  visibleCount: number;
  pageSize: number;
  onLoadMore: () => void;
  ariaBusy?: boolean;
};

export function ProfileGroupsList({
  title = 'Groupes',
  groups,
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
            <ul className="space-y-3">
              {groups.map((g: any, idx) => (
                <li key={g?.id || g?.groupId || idx} className="border border-[color:var(--border)] rounded p-2">
                  <div className="font-medium">{g?.name || '–'}</div>
                  {g?.description && (
                    <div className="text-xs opacity-70">{g.description}</div>
                  )}
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

