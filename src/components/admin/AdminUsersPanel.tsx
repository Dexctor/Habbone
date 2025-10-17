"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Ban, Trash2 } from "lucide-react";

type Role = {
  id: string;
  name: string;
  description?: string | null;
  admin_access?: boolean;
  app_access?: boolean;
};

type User = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  role?: { id: string; name?: string; admin_access?: boolean; app_access?: boolean } | string | null;
  _legacyBanned?: boolean;
  _legacyInactive?: boolean;
  _source?: "legacy" | "directus";
  _roleName?: string | null;
  _flags?: {
    isFounder?: boolean;
    isAdmin?: boolean;
    order?: number;
  };
};

type SourceOption = "auto" | "legacy" | "directus";

type HighlightMetric = {
  label: string;
  value: number;
  caption?: string;
  tone: "default" | "positive" | "muted" | "alert";
};

type AdminUsersPanelProps = {
  onOpenRoles?: () => void;
};

const METRIC_CONTAINER_VARIANTS: Record<HighlightMetric["tone"], string> = {
  default: "border-[color:var(--bg-600)]/70 before:bg-[color:var(--bg-400)]/45",
  positive: "border-emerald-500/45 before:bg-emerald-400/55",
  muted: "border-[color:var(--bg-600)]/65 before:bg-[color:var(--bg-500)]/40",
  alert: "border-rose-500/45 before:bg-rose-400/55",
};

const METRIC_VALUE_VARIANTS: Record<HighlightMetric["tone"], string> = {
  default: "text-[color:var(--foreground)]",
  positive: "text-emerald-200",
  muted: "text-[color:var(--foreground)]/85",
  alert: "text-rose-200",
};

const limit = 10;

function normalizeRoleName(name?: string | null): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export default function AdminUsersPanel({ onOpenRoles }: AdminUsersPanelProps = {}) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [banLoadingId, setBanLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  const [q, setQ] = useState("");
  const [roleId, setRoleId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [source, setSource] = useState<SourceOption>("auto");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/admin/roles/list", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => setRoles(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setRoles([]));
  }, []);

  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        value: r.id,
        label: r.name,
        admin: r.admin_access === true,
      })),
    [roles],
  );
  const roleLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of roleOptions) map.set(String(opt.value), opt.label);
    return map;
  }, [roleOptions]);

  const getUsers = async ({
    page: targetPage = page,
    source: targetSource = source,
    query: targetQuery = q,
    role: targetRole = roleId,
    status: targetStatus = status,
  }: {
    page?: number;
    source?: SourceOption;
    query?: string;
    role?: string;
    status?: string;
  } = {}) => {
    setLoading(true);
    const qs = targetSource === "auto" ? "" : `?source=${targetSource}`;
    try {
      const res = await fetch(`/api/admin/users/search${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          q: targetQuery || undefined,
          roleId: targetRole || undefined,
          status: targetStatus || undefined,
          page: targetPage,
          limit,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error || "Echec de la recuperation des utilisateurs");
        setItems([]);
        setTotal(0);
        return;
      }
      const rows: User[] = Array.isArray(json?.data) ? json.data : [];
      const decorated = rows
        .map((user, index) => {
          const roleObj =
            user && typeof user.role === "object" && user.role !== null
              ? (user.role as { id?: string; name?: string; admin_access?: boolean })
              : null;
          const roleNameRaw =
            typeof user._roleName === "string" && user._roleName
              ? user._roleName
              : roleObj?.name
                ? roleObj.name
                : "";
          const normalizedRole = normalizeRoleName(roleNameRaw);
          const isFounder = normalizedRole.includes("fondateur") || normalizedRole.includes("founder");
          const isAdmin = !!roleObj?.admin_access || normalizedRole.includes("admin");
          const normalizedStatus = normalizeRoleName(user.status || "");
          const isFlagged = !!(user._legacyBanned || user._legacyInactive || normalizedStatus === "suspended");
          return {
            ...user,
            _flags: {
              isFounder,
              isAdmin,
              isFlagged,
              order: index,
            },
          };
        })
        .sort((a, b) => {
          const weight = (u: User) => {
            if (u._flags?.isFounder) return 0;
            if (u._flags?.isAdmin) return 1;
            return 2;
          };
          const diff = weight(a) - weight(b);
          if (diff !== 0) return diff;
          return (a._flags?.order ?? 0) - (b._flags?.order ?? 0);
        });

      setItems(decorated);
      setTotal(Number(json?.total || rows.length || 0));
      setPage(targetPage);

      const next: Record<string, string> = {};
      for (const u of decorated) {
        const r = typeof u.role === "object" ? (u.role as any)?.id : (u.role as any);
        if (r) next[u.id] = String(r);
      }
      setSelectedRoles(next);
    } catch (err) {
      toast.error("Impossible de charger les utilisateurs");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers({ page: 1, source }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const pageCount = Math.max(1, Math.ceil(total / limit));

  const highlightStats = useMemo<HighlightMetric[]>(() => {
    const pageLength = items.length;
    let activeCount = 0;
    let flaggedCount = 0;
    let directusCount = 0;
    let legacyCount = 0;

    for (const user of items) {
      const normalizedStatus = normalizeRoleName(user.status || "");
      if (normalizedStatus === "active") {
        activeCount += 1;
      }
      if (user._flags?.isFlagged || user._legacyBanned || user._legacyInactive) {
        flaggedCount += 1;
      }
      if (user._source === "directus") {
        directusCount += 1;
      }
      if (user._source === "legacy") {
        legacyCount += 1;
      }
    }

    const metrics: HighlightMetric[] = [
      {
        label: "Actifs (page)",
        value: activeCount,
        caption: "Utilisateurs actifs affiches",
        tone: "positive",
      },
    ];

    metrics.unshift({
      label: "Resultats filtres",
      value: total,
      caption: `${pageLength}/${limit} visibles`,
      tone: "default",
    });

    metrics.push({
      label: "Comptes signales",
      value: flaggedCount,
      caption: flaggedCount ? "Bannis ou inactifs" : "Aucun signalement",
      tone: flaggedCount ? "alert" : "muted",
    });

    return metrics;
  }, [items, total]);

const selectTriggerClass =
  "h-10 w-full rounded-md border border-[color:var(--bg-600)]/65 bg-[color:var(--bg-800)]/55 px-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--bg-400)]/70 focus-visible:border-[color:var(--bg-300)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bg-300)]/30 disabled:cursor-not-allowed disabled:opacity-60";
const selectContentClass =
  "rounded-md border border-[color:var(--bg-500)]/70 bg-[color:var(--bg-900)]/85 text-[color:var(--foreground)] shadow-lg backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95";
const selectItemClass =
  "cursor-pointer rounded-sm px-3 py-2 text-sm transition data-[highlighted]:bg-[color:var(--bg-600)] data-[highlighted]:text-[color:var(--foreground)] data-[state=checked]:bg-[color:var(--bg-600)] data-[state=checked]:text-[color:var(--foreground)]";
  const primaryButtonClass =
    "h-11 px-5 text-xs font-semibold uppercase tracking-[0.2em] bg-[color:var(--bg-400)] text-[color:var(--foreground)] transition hover:bg-[color:var(--bg-300)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bg-300)]/40 lg:w-auto";
  const outlineButtonClass =
    "h-11 px-5 text-xs font-semibold uppercase tracking-[0.2em] border border-[color:var(--bg-500)]/60 bg-[color:var(--bg-800)]/60 text-[color:var(--foreground)] transition hover:border-[color:var(--bg-400)]/70 hover:bg-[color:var(--bg-700)]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bg-300)]/35 lg:w-auto";
  const secondaryButtonClass = outlineButtonClass;

  const onSaveRole = async (userId: string, nextRoleId: string | undefined, disabled: boolean) => {
    if (disabled || savingId) return;
    if (!nextRoleId) {
      toast.error("Selectionnez un role");
      return;
    }
    setSavingId(userId);
    try {
      const res = await fetch("/api/admin/users/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ userId, roleId: nextRoleId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json?.code === "USER_INACTIVE") {
          toast.error("Utilisateur banni ou inactif : modification refusee");
        } else {
          toast.error(json?.error || "Echec de la mise a jour du role");
        }
        return;
      }
      toast.success("Role mis a jour");
      await getUsers();
    } catch {
      toast.error("Impossible de mettre a jour le role");
    } finally {
      setSavingId(null);
    }
  };

  const handleSearch = () => {
    setPage(1);
    getUsers({ page: 1 }).catch(() => undefined);
  };

  const handleReset = () => {
    const nextQuery = "";
    const nextRole = undefined;
    const nextStatus = undefined;
    setQ(nextQuery);
    setRoleId(nextRole);
    setStatus(nextStatus);
    setPage(1);
    setSelectedRoles({});
    getUsers({ page: 1, query: nextQuery, role: nextRole, status: nextStatus }).catch(() => undefined);
  };

  const formatFullName = (user: User) => {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
    return fullName || "-";
  };

  const getStatusBadges = (user: User) => {
    const badges: { label: string; variant: "default" | "secondary" | "destructive" }[] = [];
    if (user.status) {
      badges.push({
        label: user.status,
        variant: user.status === "active" ? "default" : "secondary",
      });
    }
    if (user._legacyBanned) {
      badges.push({ label: "Banni", variant: "destructive" });
    }
    if (user._legacyInactive) {
      badges.push({ label: "Inactif", variant: "secondary" });
    }
    return badges;
  };

  const sourceBadgeLabel = source === "auto" ? "Automatique (legacy <-> Directus)" : source;

  const applyBanStateLocally = (userId: string, banned: boolean) => {
    setItems((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;
        const next: User = {
          ...user,
          status: banned ? "suspended" : "active",
          _flags: {
            ...user._flags,
            isFlagged: banned,
          },
        };
        if (user.id.startsWith("legacy:")) {
          next._legacyBanned = banned;
          next._legacyInactive = banned;
        } else {
          if (typeof user._legacyBanned !== "undefined") next._legacyBanned = banned;
          if (typeof user._legacyInactive !== "undefined") next._legacyInactive = banned;
        }
        return next;
      }),
    );
  };

  const handleToggleBan = async (user: User, ban: boolean) => {
    const confirmMessage = ban
      ? `Bannir l'utilisateur ${formatFullName(user)} ?`
      : `Reactiver l'utilisateur ${formatFullName(user)} ?`;
    if (typeof window !== "undefined" && !window.confirm(confirmMessage)) {
      return;
    }
    setBanLoadingId(user.id);
    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ userId: user.id, ban }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error || "Impossible de mettre a jour le statut");
        return;
      }
      applyBanStateLocally(user.id, ban);
      toast.success(ban ? "Utilisateur banni" : "Utilisateur reactive");
    } catch {
      toast.error("Impossible de mettre a jour le statut");
    } finally {
      setBanLoadingId(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    const label = formatFullName(user) || user.email || "cet utilisateur";
    if (typeof window !== "undefined" && !window.confirm(`Supprimer definitivement ${label} ?`)) {
      return;
    }
    setDeleteLoadingId(user.id);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ userId: user.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error || "Suppression impossible");
        return;
      }
      setItems((prev) => prev.filter((u) => u.id !== user.id));
      setSelectedRoles((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success("Utilisateur supprime");
    } catch {
      toast.error("Suppression impossible");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-700)]/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <Badge
            variant="outline"
            className="w-fit rounded-full border-[color:var(--bg-600)]/70 bg-[color:var(--bg-800)]/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)]/75">
            Utilisateurs
          </Badge>
          <h3 className="text-lg font-semibold leading-tight text-[color:var(--foreground)]">Pilotage des affectations</h3>
          <p className="max-w-2xl text-sm text-[color:var(--foreground)]/70">
            Explorez la base Directus ou legacy, verifiez les statuts et ajustez les roles sans quitter ce panneau.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge
              variant="outline"
              className="rounded-full border-[color:var(--bg-600)]/60 bg-[color:var(--bg-800)]/60 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-wide">
              Source : {sourceBadgeLabel}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-[color:var(--bg-600)]/60 bg-[color:var(--bg-800)]/60 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-wide">
              {loading ? "Chargement..." : `${total} resultat${total > 1 ? "s" : ""}`}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
            className={outlineButtonClass}>
            Reinitialiser les filtres
          </Button>
          {onOpenRoles ? (
            <Button onClick={onOpenRoles} className="h-10 px-4 text-sm font-semibold">
              Gerer les roles & acces
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {highlightStats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "group relative overflow-hidden rounded-lg border bg-[color:var(--bg-800)]/55 px-4 py-3 shadow-[0_12px_32px_-28px_rgba(0,0,0,0.65)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-[color:var(--bg-500)]/70 before:absolute before:left-0 before:top-0 before:h-1 before:w-full before:rounded-t-lg before:opacity-90 before:content-['']",
              METRIC_CONTAINER_VARIANTS[stat.tone],
            )} >
            <span className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/70">
                {stat.label}
              </span>
              <span className={cn("mt-1 block text-2xl font-semibold", METRIC_VALUE_VARIANTS[stat.tone])}>
                {stat.value}
              </span>
              {stat.caption ? (
                <p className="text-xs text-[color:var(--foreground)]/65">{stat.caption}</p>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-[color:var(--bg-700)]/55 bg-[color:var(--bg-900)]/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-2">
            <Label
              htmlFor="admin-users-search"
              className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/70">
              Recherche rapide
            </Label>
            <Input
              id="admin-users-search"
              placeholder="Rechercher par email ou nom"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              aria-label="Rechercher par email ou nom"
              className="h-11 w-full rounded-lg border border-[color:var(--bg-600)]/60 bg-[color:var(--bg-800)]/55 px-4 text-sm font-medium text-[color:var(--foreground)]/85 placeholder:text-[color:var(--foreground)]/35 focus-visible:border-[color:var(--bg-300)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bg-300)]/30"
            />
          </div>
          <div className="flex w-full gap-2 lg:w-auto">
            <Button
              onClick={handleSearch}
              disabled={loading}
              aria-busy={loading}
              className={primaryButtonClass}>
              {loading ? "Recherche..." : "Appliquer les filtres"}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label
              htmlFor="admin-users-source"
              className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/70">
              Source des utilisateurs
            </Label>
            <Select
              value={source}
              onValueChange={(v) => {
                const next = v as SourceOption;
                setSource(next);
              }}
            >
              <SelectTrigger id="admin-users-source" className={selectTriggerClass}>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value="auto" className={selectItemClass}>
                  Automatique
                </SelectItem>
                <SelectItem value="legacy" className={selectItemClass}>
                  Legacy (usuarios)
                </SelectItem>
                <SelectItem value="directus" className={selectItemClass}>
                  Directus
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="admin-users-status"
              className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/70">
              Statut
            </Label>
            <Select
              value={status ?? "__ALL__"}
              onValueChange={(v) => {
                setStatus(v === "__ALL__" ? undefined : v);
              }}
            >
              <SelectTrigger id="admin-users-status" className={selectTriggerClass}>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value="__ALL__" className={selectItemClass}>
                  Tous les statuts
                </SelectItem>
                <SelectItem value="active" className={selectItemClass}>
                  Actif
                </SelectItem>
                <SelectItem value="suspended" className={selectItemClass}>
                  Suspendu
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="admin-users-role"
              className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/70">
              Filtrer par role
            </Label>
            <Select
              value={roleId ?? "__ALL__"}
              onValueChange={(v) => {
                setRoleId(v === "__ALL__" ? undefined : v);
              }}
            >
              <SelectTrigger id="admin-users-role" className={selectTriggerClass}>
                <SelectValue placeholder="Filtrer par role" />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value="__ALL__" className={selectItemClass}>
                  Tous les roles
                </SelectItem>
                {roleOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} className={selectItemClass}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--bg-700)]/70 bg-[color:var(--bg-800)]/40 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.7)]">
        <Accordion type="multiple" className="space-y-3 p-4">
          {items.map((u) => {
            const currentRoleId = typeof u.role === "object" ? (u.role as any)?.id : (u.role as any);
            const selected = selectedRoles[u.id] ?? currentRoleId ?? "";
            const flags = u._flags ?? {};
            const isFounder = flags.isFounder === true;
            const isAdminRole = flags.isAdmin === true && !isFounder;
            const isFlagged = flags.isFlagged === true || !!(u._legacyBanned || u._legacyInactive);
            const disableRoleChange = isFlagged;
            const isSaving = savingId === u.id;
            const isBanBusy = banLoadingId === u.id;
            const isDeleteBusy = deleteLoadingId === u.id;
            const statusBadges = getStatusBadges(u);
            const roleSelectId = `admin-user-role-${u.id}`;
            const backendRoleName =
              typeof (u as any)._roleName === "string" ? ((u as any)._roleName as string).trim() : "";
            const currentRoleLabel = (() => {
              if (backendRoleName) return backendRoleName;
              if (typeof u.role === "object" && u.role) {
                const directName = (u.role as any)?.name;
                if (typeof directName === "string" && directName.trim().length > 0) {
                  return directName;
                }
                const idValue = (u.role as any)?.id;
                if (idValue) {
                  return roleLabelById.get(String(idValue)) || "";
                }
              }
              if (currentRoleId) {
                return roleLabelById.get(String(currentRoleId)) || "";
              }
              return "";
            })();
            const selectionChanged = !!selected && selected !== (currentRoleId ?? "");
            const emphasisClass = selectionChanged
              ? "border-[#f7c600]/70 bg-[#f7c600]/15 text-[#f7c600] hover:bg-[#f7c600]/25 hover:text-[#fce58b]"
              : "";
            const itemClass = cn(
              "border-none rounded-xl border border-[color:var(--bg-700)] bg-[color:var(--bg-800)]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors",
              isFounder
                ? "border-[color:var(--bg-800)] bg-[color:var(--bg-900)]/80 hover:border-[color:var(--bg-600)]"
                : isAdminRole
                  ? "border-[color:var(--bg-700)] bg-[color:var(--bg-800)]/65 hover:border-[color:var(--bg-500)]"
                  : "hover:border-[color:var(--bg-500)] hover:bg-[color:var(--bg-800)]",
            );
            const roleBadgeClass = cn(
              "rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]",
              isFounder
                ? "border-[#f7c600]/70 bg-gradient-to-r from-[#f7c600]/25 via-[#f7c600]/10 to-transparent text-[#fce58b]"
                : isAdminRole
                  ? "border-[color:var(--bg-500)]/70 bg-[color:var(--bg-700)]/55 text-[color:var(--foreground)]"
                  : "border-[color:var(--bg-600)]/70 bg-[color:var(--bg-700)]/60 text-[color:var(--foreground)]",
            );
            return (
              <AccordionItem key={u.id} value={u.id} className={itemClass}>
                <AccordionTrigger className="gap-4 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)] hover:no-underline">
                  <div className="w-full space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)]/85">
                      <span className="text-sm font-semibold tracking-[0.18em]">{formatFullName(u)}</span>
                      {isFounder ? (
                        <Badge
                          variant="outline"
                          className="border-[#f7c600]/70 bg-gradient-to-r from-[#f7c600]/25 via-transparent to-[#f7c600]/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[#fce58b]">
                          Fondateur
                        </Badge>
                      ) : isAdminRole ? (
                        <Badge
                          variant="outline"
                          className="border-[color:var(--bg-500)]/70 bg-[color:var(--bg-500)]/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--foreground)]">
                          Admin
                        </Badge>
                      ) : null}
                      {isFlagged ? (
                        <Badge variant="destructive" className="px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.22em]">
                          Bloque
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--foreground)]/55">
                      {u.email || "-"}
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--foreground)]/75">
                      <Badge variant="outline" className={roleBadgeClass}>
                        Role actuel : {currentRoleLabel || "Aucun"}
                      </Badge>
                      {statusBadges.length === 0 ? (
                        <Badge
                          variant="outline"
                          className="border-[color:var(--bg-600)]/60 bg-[color:var(--bg-700)]/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]">
                          Aucun statut
                        </Badge>
                      ) : (
                        statusBadges.map(({ label, variant }) => (
                          <Badge
                            key={label}
                            variant={variant}
                            className="px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]">
                            {label}
                          </Badge>
                        ))
                      )}
                      <Badge
                        variant="outline"
                        className="border-[color:var(--bg-600)]/60 bg-[color:var(--bg-700)]/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]">
                        Source : {u._source || "Inconnue"}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor={roleSelectId}
                          className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/75">
                          Role attribue
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Select
                                value={selected || undefined}
                                onValueChange={(v) => setSelectedRoles((m) => ({ ...m, [u.id]: v }))}
                                disabled={isSaving || disableRoleChange}>
                                <SelectTrigger id={roleSelectId} className={selectTriggerClass}>
                                  <SelectValue placeholder="Choisir un role" />
                                </SelectTrigger>
                                <SelectContent className={selectContentClass}>
                                  {roleOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value} className={selectItemClass}>
                                      {o.label}
                                      {o.admin ? " (admin)" : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TooltipTrigger>
                          {(u._legacyBanned || u._legacyInactive) && (
                            <TooltipContent sideOffset={6}>Utilisateur banni ou inactif</TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                      <Button
                        size="sm"
                        variant={selectionChanged ? "default" : "secondary"}
                        disabled={isSaving || !selected || disableRoleChange}
                        aria-label={`Sauvegarder le role pour ${formatFullName(u) || u.email || "utilisateur"}`}
                        aria-busy={isSaving}
                        onClick={() => onSaveRole(u.id, selected || currentRoleId || undefined, disableRoleChange)}
                        className={cn(
                          "h-10 w-full justify-center text-[0.65rem] font-semibold uppercase tracking-[0.22em]",
                          secondaryButtonClass,
                          emphasisClass,
                        )}>
                        {isSaving ? "Enregistrement..." : selectionChanged ? "Sauvegarder le nouveau role" : "Sauvegarder"}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant={isFlagged ? "secondary" : "destructive"}
                        disabled={isBanBusy}
                        aria-busy={isBanBusy}
                        onClick={() => handleToggleBan(u, !isFlagged)}
                        className={cn(
                          "group h-10 w-full justify-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] transition-transform hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-20px_rgba(239,68,68,0.55)]",
                          isFlagged
                            ? "border border-[color:var(--bg-600)]/60 bg-[color:var(--bg-800)]/55 hover:bg-[color:var(--bg-700)]/60"
                            : "bg-[#301118] hover:bg-[#3d1620]",
                        )}>
                        {isBanBusy ? (
                          "Traitement..."
                        ) : (
                          <>
                            <Ban className="h-4 w-4 transition-colors text-[color:var(--foreground)] group-hover:text-[#ff4747]" />
                            <span>{isFlagged ? "Reactiver l'utilisateur" : "Bannir l'utilisateur"}</span>
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isDeleteBusy}
                        aria-busy={isDeleteBusy}
                        onClick={() => handleDeleteUser(u)}
                        className="group h-10 w-full justify-center gap-2 bg-[#3d131a] text-[0.65rem] font-semibold uppercase tracking-[0.22em] transition-transform hover:-translate-y-0.5 hover:bg-[#4a171f] hover:shadow-[0_12px_28px_-20px_rgba(239,68,68,0.55)]">
                        {isDeleteBusy ? (
                          "Suppression..."
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 transition-colors text-[color:var(--foreground)] group-hover:text-[#ff4747]" />
                            <span>Supprimer l'utilisateur</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        {items.length === 0 && !loading ? (
          <div className="py-16 text-center text-sm text-[color:var(--foreground)]/60">Aucun resultat</div>
        ) : null}
      </section>
      {pageCount > 1 && (
        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-end">
          <div className="text-xs text-[color:var(--foreground)]/65 sm:mr-auto">
            Page {page} sur {pageCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => getUsers({ page: Math.max(1, page - 1) }).catch(() => undefined)}
              className={secondaryButtonClass}>
              Precedent
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= pageCount || loading}
              onClick={() => getUsers({ page: Math.min(pageCount, page + 1) }).catch(() => undefined)}
              className={secondaryButtonClass}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

