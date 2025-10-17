"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, MessageSquare, Coins } from "lucide-react";
import { ProfileInfoRow } from "./ProfileInfoRow";

export type ProfileStats = {
  topics: number;
  comments: number;
  articles: number;
  coins: number;
  friends: number;
  groups: number;
  badges: number;
};

export type WorldRanking = { label: string; value: string; icon?: string };

export function ProfileInfoList(props: {
  stats: ProfileStats;
  rankings: WorldRanking[];
  favoritesBadges?: string[];
  onRefresh?: () => void;
}) {
  const { stats, rankings, favoritesBadges = [], onRefresh } = props;
  return (
    <Card className="bg-[color:var(--bg-600)] border-[color:var(--bg-800)]">
      <CardContent className="p-0 flex flex-col gap-2.5">
        <ProfileInfoRow icon="/img/topics-mini.png" label="Sujets postés" value={stats.topics} />
        <ProfileInfoRow icon="/img/icon-comment.png" label="Commentaires postés" value={stats.comments} />
        <ProfileInfoRow icon="/img/pincel-mini.png" label="Articles postés" value={stats.articles} />
        <ProfileInfoRow icon="/img/coin-mini.png" label="Coins" value={stats.coins} />
        <ProfileInfoRow icon="/img/friends.png" label="Amis" value={stats.friends} />
        <ProfileInfoRow icon="/img/groups.png" label="Groupes" value={stats.groups} />
        <ProfileInfoRow icon="/img/badges.gif" label="Badges" value={stats.badges} />

        <div className="px-4 pt-3">
          <h3 className="text-sm font-semibold text-foreground">Classements mondiaux</h3>
        </div>
        {rankings.map((r, i) => (
          <ProfileInfoRow
            key={i}
            icon={r.icon ?? "/assets/img/trophy-mini.png"}
            label={`${r.label} :`}
            valueNode={<Badge className="bg-muted text-foreground font-medium">{r.value}</Badge>}
          />
        ))}

        <div className="px-4 py-3 border-t">
          <div className="text-sm font-medium mb-2">Badges favoris</div>
          <div className="flex flex-wrap gap-2">
            {favoritesBadges?.length ? (
              favoritesBadges.map((src, i) => (
                <div key={i} className="size-8 rounded bg-muted grid place-items-center border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`badge-${i}`} className="max-w-full" />
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">Aucun badge favori</div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10"
              title="Rafraîchir"
              aria-label="Rafraîchir"
              onClick={onRefresh}
            >
              <RefreshCw className="size-4" />
            </Button>
            <Button variant="secondary" size="icon" className="h-10 w-10" title="Commentaires" aria-label="Commentaires">
              <MessageSquare className="size-4" />
            </Button>
            <Button variant="secondary" size="icon" className="h-10 w-10" title="Coins" aria-label="Coins">
              <Coins className="size-4" />
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Card className="bg-muted/40">
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] scroll-area">
                <div className="divide-y">
                  <div className="flex items-center justify-between gap-4 p-3">
                    <div className="inline-flex size-10 items-center justify-center rounded-full bg-muted font-semibold">1</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">PseudoExemple</div>
                      <div className="text-xs text-muted-foreground">Score: 9999</div>
                    </div>
                    <Badge>FR</Badge>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

