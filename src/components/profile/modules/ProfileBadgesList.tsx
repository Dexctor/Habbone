"use client";

import { Card, CardBody, CardHeader, CardTitle } from "./Card";
import { BadgeIcon } from "./BadgeIcon";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  title?: string;
  badges: any[];
  totalCount: number;
  visibleCount: number;
  pageSize: number;
  onLoadMore: () => void;
  ariaBusy?: boolean;
};

export function ProfileBadgesList({
  title = 'Badges',
  badges,
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
            <ul className="grid grid-cols-6 sm:grid-cols-10 gap-2">
              {badges.map((b: any, idx) => {
                const rawCode = (b?.code || b?.badgeCode || b?.badge_code || b?.badge?.code || '').toString();
                const code = rawCode.trim();
                // Collect potential image url hints from API
                const imageUrl = (
                  b?.imageUrl || b?.badgeImageUrl || b?.image || b?.url || b?.iconUrl || b?.icon_url || b?.smallImageUrl || b?.small_image_url || ''
                ) as string | undefined;
                // Album from payload or derived from URL or code/category
                let album: string | undefined = (b?.album || b?.badgeAlbum || b?.category || b?.badgeCategory) as string | undefined;
                if (!album && imageUrl) {
                  try {
                    const u = new URL(imageUrl);
                    const m = u.pathname.match(/\/(?:c_images|C_IMAGES)\/([^/]+)\//);
                    if (m && m[1]) album = m[1];
                  } catch {
                    const m = String(imageUrl).match(/\/(?:c_images|C_IMAGES)\/([^/]+)\//);
                    if (m && m[1]) album = m[1];
                  }
                }
                if (!album) {
                  if (code.startsWith('ACH_')) album = 'album1584';
                }
                return (
                  <li key={code || idx} className="flex flex-col items-center text-center">
                    <BadgeIcon code={code} album={album} imageUrl={imageUrl} />
                  </li>
                );
              })}
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
