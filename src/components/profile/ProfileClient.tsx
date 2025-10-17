"use client";

import { useEffect, useMemo, useState } from "react";
import { ProfileHeaderCard } from "./modules/ProfileHeaderCard";
import { ProfileInfoList } from "./modules/ProfileInfoList";
import { ProfileSection } from "./modules/ProfileSection";
import { ProfileTabs } from "./modules/ProfileTabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeIcon } from "./modules/BadgeIcon";
import Link from "next/link";
import { listNewsByAuthor, mediaUrl } from "@/lib/directus";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import "./profile.tailwind.css";

type HabboProfileResponse = {
  user: any;
  profile: any | null;
  friends: any[];
  groups: any[];
  rooms: any[];
  badges: any[];
  uniqueId: string;
  achievements?: any[];
  achievementsCount?: number;
  achievementsTotalCount?: number;
};

const PAGE_SIZE = 100;
const HABBO_BASE = process.env.NEXT_PUBLIC_HABBO_BASE || "https://www.habbo.fr";

export default function ProfileClient({ nick }: { nick: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HabboProfileResponse | null>(null);

  const [friendsPage, setFriendsPage] = useState(1);
  const [groupsPage, setGroupsPage] = useState(1);
  const [badgesPage, setBadgesPage] = useState(1);
  const [roomsPage, setRoomsPage] = useState(1);
  const [articles, setArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesPage, setArticlesPage] = useState(0);
  const [articlesDir, setArticlesDir] = useState<1 | -1>(1);
  const reduce = useReducedMotion();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setData(null);

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/habbo/profile?name=${encodeURIComponent(nick)}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as HabboProfileResponse | { error: string };
        if (!res.ok) {
          throw new Error((json as any)?.error || "Erreur de récupération du profil");
        }
        if (mounted) setData(json as HabboProfileResponse);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Erreur");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [nick]);

  // Broadcast profile data to the header (mutualize on /profile)
  useEffect(() => {
    if (typeof window === "undefined" || !data) return;
    try {
      (window as any).__habboProfile = data;
      const lvl = data?.user?.currentLevel ?? (data as any)?.profile?.currentLevel ?? null;
      (window as any).__habboLevel = typeof lvl === "number" ? lvl : null;
      window.dispatchEvent(new CustomEvent("habbo:profile", { detail: data }));
    } catch {}
  }, [data]);

  // Fetch articles by logged user nick
  useEffect(() => {
    const author = (data as any)?.user?.name || nick;
    if (!author) return;
    let cancelled = false;
    setArticlesLoading(true);
    listNewsByAuthor(author, 30)
      .then((rows: any) => {
        if (!cancelled) setArticles(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setArticlesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nick, (data as any)?.user?.name]);

  // Reset page when data changes
  useEffect(() => {
    setArticlesPage(0);
  }, [articles.length]);

  const PER_ARTICLES = 4;
  const articlesPageCount = Math.max(1, Math.ceil(articles.length / PER_ARTICLES));
  const visibleArticles = useMemo(
    () =>
      articles.slice(
        articlesPage * PER_ARTICLES,
        articlesPage * PER_ARTICLES + PER_ARTICLES
      ),
    [articles, articlesPage]
  );

  const counts = useMemo(() => {
    const achCount = typeof (data as any)?.achievementsCount === "number"
      ? (data as any).achievementsCount
      : Array.isArray(data?.achievements)
        ? data!.achievements!.length
        : 0;
    const achTotal = typeof (data as any)?.achievementsTotalCount === "number"
      ? (data as any).achievementsTotalCount
      : undefined;
    return {
      friends: data?.friends?.length ?? 0,
      groups: data?.groups?.length ?? 0,
      badges: data?.badges?.length ?? 0,
      rooms: data?.rooms?.length ?? 0,
      achievements: achCount,
      achievementsTotal: achTotal,
    } as const;
  }, [data]);

  const friendsVisible = useMemo(
    () => (data?.friends ?? []).slice(0, friendsPage * PAGE_SIZE),
    [data, friendsPage]
  );
  const groupsVisible = useMemo(
    () => (data?.groups ?? []).slice(0, groupsPage * PAGE_SIZE),
    [data, groupsPage]
  );
  const badgesVisible = useMemo(
    () => (data?.badges ?? []).slice(0, badgesPage * PAGE_SIZE),
    [data, badgesPage]
  );
  const roomsVisible = useMemo(
    () => (data?.rooms ?? []).slice(0, roomsPage * PAGE_SIZE),
    [data, roomsPage]
  );

  function fmtMemberSince(v?: string) {
    if (!v) return "";
    // Normalize timezone like +0000 -> +00:00 for Date parsing
    const norm = v.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
    const d = new Date(norm);
    return isNaN(+d) ? v : d.toLocaleDateString();
  }

  // Flexible date formatter for Directus values (ISO, ms, or seconds)
  function fmtDateFlexible(v?: any): string {
    if (v == null || v === "") return "";
    if (typeof v === "number") {
      const ms = v > 1e12 ? v : v * 1000; // seconds -> ms
      return new Date(ms).toLocaleString();
    }
    const n = Number(v);
    if (!Number.isNaN(n) && n > 0) {
      const ms = n > 1e12 ? n : n * 1000;
      return new Date(ms).toLocaleString();
    }
    const t = Date.parse(String(v));
    return Number.isNaN(t) ? "" : new Date(t).toLocaleString();
  }

  const headerAvatarUrl = `${HABBO_BASE}/habbo-imaging/avatarimage?user=${encodeURIComponent(
    (data as any)?.user?.name || nick || ""
  )}&direction=2&head_direction=3&img_format=png&size=l`;

  return (
    <div className="profile-page">
      <div className="profile-container space-y-6" aria-busy={loading} aria-live="polite">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 border border-red-600/30 rounded p-3 bg-red-600/10">
            {error}
          </div>
        )}

        {/* Header */}
        {data && (
          <ProfileHeaderCard
            nick={(data as any)?.user?.name || nick}
            memberSince={fmtMemberSince((data as any)?.user?.memberSince)}
            level={(data as any)?.user?.currentLevel ?? (data as any)?.profile?.currentLevel}
            starGems={(data as any)?.user?.starGemCount}
            avatarUrl={headerAvatarUrl}
            motto={(data as any)?.user?.motto}
            ariaBusy={loading}
          />
        )}

        {/* Counters */}
        <Card className="bg-[color:var(--bg-600)] border-[color:var(--bg-800)]">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4">
            {([
              { label: "Amis", value: counts.friends },
              { label: "Groupes", value: counts.groups },
              { label: "Badges", value: counts.badges },
              { label: "Salles", value: counts.rooms },
              {
                label: "Succès",
                value: typeof counts.achievementsTotal === "number" ? counts.achievementsTotal : counts.achievements,
              },
            ] as const).map((it) => (
              <div key={it.label} className="text-center border rounded p-3 border-[color:var(--border)]">
                <div className="text-xs opacity-70">{it.label}</div>
                <div className="text-xl font-semibold">{it.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <ProfileSection title="Infos de profil">
              <div className="rounded-md bg-muted/40 p-4 text-center font-semibold text-destructive">Pas d'informations</div>
            </ProfileSection>

            <ProfileSection
              title="Articles postés"
              onPrev={articlesPage > 0 ? () => { setArticlesDir(-1); setArticlesPage((p) => Math.max(0, p - 1)); } : undefined}
              onNext={articlesPage < articlesPageCount - 1 ? () => { setArticlesDir(1); setArticlesPage((p) => Math.min(articlesPageCount - 1, p + 1)); } : undefined}
            >
              {articlesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : articles.length ? (
                <div className="space-y-3" aria-live="polite">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={articlesPage}
                      initial={reduce ? {} : { opacity: 0, x: articlesDir * 30 }}
                      animate={reduce ? {} : { opacity: 1, x: 0 }}
                      exit={reduce ? {} : { opacity: 0, x: -articlesDir * 30 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {visibleArticles.map((a: any) => (
                          <li key={a.id} className="border rounded p-3 border-[color:var(--border)]">
                            <div className="flex gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={a.imagem ? mediaUrl(a.imagem) : "/img/thumbnail.png"}
                                alt={a.titulo ? `Miniature de ${a.titulo}` : "Miniature d'article"}
                                className="w-16 h-16 rounded object-cover"
                                loading="lazy"
                              />
                              <div className="min-w-0 flex-1">
                                <Link href={`/news/${a.id}`} className="font-medium hover:underline truncate block">
                                  {a.titulo ?? `Article #${a.id}`}
                                </Link>
                                <div className="text-xs opacity-70 mt-1 truncate">
                                  Par {a.autor ?? '—'} · {fmtDateFlexible(a.data)}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex items-center justify-center gap-2 text-xs opacity-70">
                    <span>
                      Page {articlesPage + 1} / {articlesPageCount}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-muted/40 p-4 text-center font-semibold text-muted-foreground">
                  Aucun article publié
                </div>
              )}
            </ProfileSection>

            <ProfileTabs
              counts={{ friends: counts.friends, groups: counts.groups, badges: counts.badges }}
              friendsSlot={(
                <>
                  <ScrollArea className="max-h-72 scroll-area">
                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-x-hidden">
                      {friendsVisible.map((f: any, idx) => (
                        <li
                          key={f?.uniqueId || f?.name || idx}
                          className="group flex flex-col items-center text-center gap-3 border rounded p-2 border-[color:var(--border)] bg-[color:var(--bg-700)] hover:bg-[color:var(--bg-600)] transition min-w-0"
                        >
                          <div className="relative w-16 h-16 rounded-full bg-[color:var(--bg-800)] flex items-center justify-center overflow-hidden ring-1 ring-[color:var(--border)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${HABBO_BASE}/habbo-imaging/avatarimage?user=${encodeURIComponent(
                                f?.name || f?.habbo || ""
                              )}&direction=2&head_direction=3&img_format=png&headonly=1&size=s`}
                              alt={`Avatar de ${f?.name || "inconnu"}`}
                              loading="lazy"
                              className="w-14 h-14 rounded"
                            />
                            {f?.online && (
                              <span
                                className="absolute right-0.5 bottom-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-[color:var(--bg-700)]"
                                aria-label="En ligne"
                                title="En ligne"
                              />
                            )}
                          </div>
                          <div className="min-w-0 w-full">
                            <div className="font-medium truncate">{f?.name || "—"}</div>
                            {f?.motto && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs opacity-70 truncate w-full" aria-label={`Devise: ${f.motto}`}>
                                    {f.motto}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent sideOffset={6}>{f.motto}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                  {counts.friends > friendsVisible.length && (
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={() => setFriendsPage((p) => p + 1)}
                      aria-label="Charger plus d'amis"
                    >
                      Charger +{Math.min(PAGE_SIZE, counts.friends - friendsVisible.length)}
                    </Button>
                  )}
                </>
              )}
              groupsSlot={
                <>
                  <ScrollArea className="max-h-72 scroll-area">
                    <ul className="space-y-3">
                      {groupsVisible.map((g: any, idx) => (
                        <li key={g?.id || g?.groupId || idx} className="border rounded p-2 border-[color:var(--border)]">
                          <div className="font-medium">{g?.name || "—"}</div>
                          {g?.description && <div className="text-xs opacity-70">{g.description}</div>}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                  {counts.groups > groupsVisible.length && (
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={() => setGroupsPage((p) => p + 1)}
                      aria-label="Charger plus de groupes"
                    >
                      Charger +{Math.min(PAGE_SIZE, counts.groups - groupsVisible.length)}
                    </Button>
                  )}
                </>
              }
              badgesSlot={
                <>
                  <ScrollArea className="max-h-72 scroll-area">
                    <ul className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                      {badgesVisible.map((b: any, idx) => {
                        const rawCode = (b?.code || b?.badgeCode || b?.badge_code || b?.badge?.code || '').toString();
                        // Preserve original case; CDN filenames for ACH_* are case-sensitive (e.g., ACH_Tutorial3)
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <BadgeIcon code={code} album={album} imageUrl={imageUrl} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={6}>{code || "Badge"}</TooltipContent>
                            </Tooltip>
                          </li>
                        );
                      })}
                  </ul>
                </ScrollArea>
                  {counts.badges > badgesVisible.length && (
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={() => setBadgesPage((p) => p + 1)}
                      aria-label="Charger plus de badges"
                    >
                      Charger +{Math.min(PAGE_SIZE, counts.badges - badgesVisible.length)}
                    </Button>
                  )}
                </>
              }
            />

            <ProfileSection title="Salles">
              <ScrollArea className="max-h-72 scroll-area">
                <ul className="space-y-3">
                  {roomsVisible.map((r: any, idx) => (
                    <li key={r?.id || idx} className="border rounded p-2 border-[color:var(--border)]">
                      <div className="font-medium">{r?.name || "—"}</div>
                      {r?.description && <div className="text-xs opacity-70">{r.description}</div>}
                      {r?.creationTime && (
                        <div className="text-xs opacity-60 mt-1">
                          {new Date(r.creationTime).toLocaleString?.() || String(r.creationTime)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
              {counts.rooms > roomsVisible.length && (
                <Button
                  variant="secondary"
                  className="mt-2"
                  onClick={() => setRoomsPage((p) => p + 1)}
                  aria-label="Charger plus de salles"
                >
                  Charger +{Math.min(PAGE_SIZE, counts.rooms - roomsVisible.length)}
                </Button>
              )}
            </ProfileSection>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <ProfileInfoList
              stats={{
                topics: 0,
                comments: 0,
                articles: 0,
                coins: 0,
                friends: counts.friends,
                groups: counts.groups,
                badges: counts.badges,
              }}
              rankings={[]}
              favoritesBadges={[]}
              onRefresh={() => {
                // Simple refetch
                setFriendsPage(1);
                setGroupsPage(1);
                setBadgesPage(1);
                setRoomsPage(1);
                setLoading(true);
                setTimeout(() => {
                  // trigger effect by changing nick dependency pattern if needed
                  // here just re-run current fetch
                  fetch(`/api/habbo/profile?name=${encodeURIComponent(nick)}`, { cache: "no-store" })
                    .then((r) => r.json())
                    .then((json) => setData(json as any))
                    .catch((e) => setError(e?.message || "Erreur"))
                    .finally(() => setLoading(false));
                }, 0);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
