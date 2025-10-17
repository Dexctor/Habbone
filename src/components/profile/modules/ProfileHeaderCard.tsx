"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileHeaderCard(props: {
  nick: string;
  memberSince?: string;
  level?: number;
  starGems?: number;
  avatarUrl: string;
  motto?: string;
  ariaBusy?: boolean;
}) {
  const { nick, memberSince, level, starGems, avatarUrl, motto, ariaBusy } = props;
  const reduce = useReducedMotion();

  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 6 }} animate={reduce ? {} : { opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card aria-busy={ariaBusy} aria-live="polite" className="bg-[color:var(--bg-600)] border-[color:var(--bg-800)]">
        <CardContent className="p-4 flex gap-3">
          <div className="relative min-w-[76px] max-w-[76px] h-[137px] rounded-md bg-[color:var(--bg-400)] bg-[url('/img/Plataforma.png')] bg-no-repeat bg-bottom flex items-end justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt={`Avatar de ${nick}`} className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 select-none" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col">
              <span className="text-base font-semibold text-foreground truncate">{nick || '—'}</span>
              {memberSince && <span className="text-xs text-muted-foreground mt-0.5">{memberSince}</span>}
            </div>
            <div className="flex flex-col mt-4">
              {typeof level === 'number' && <span className="text-sm font-semibold">Niveau {level}</span>}
              {typeof starGems === 'number' && (
                <span className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/star-blue-mini.png" alt="étoile" className="size-4" />
                  {starGems} étoiles
                </span>
              )}
              {motto && <span className="mt-2 text-xs text-muted-foreground truncate">{motto}</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

