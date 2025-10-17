"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Shield, UsersRound } from "lucide-react";

type Role = {
  id: string;
  name: string;
  description?: string | null;
  admin_access?: boolean;
  app_access?: boolean;
};

type EditableRole = Pick<Role, "id" | "name" | "description">;

type StatTone = "indigo" | "emerald" | "sky";

const STAT_STYLES: Record<StatTone, { bg: string; text: string }> = {
  indigo: { bg: "from-indigo-500/12 via-indigo-500/4 to-transparent", text: "text-indigo-100" },
  emerald: { bg: "from-emerald-500/12 via-emerald-500/4 to-transparent", text: "text-emerald-100" },
  sky: { bg: "from-sky-500/12 via-sky-500/4 to-transparent", text: "text-sky-100" },
};

export default function AdminRolesPanel() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingRole, setEditingRole] = useState<EditableRole | null>(null);
  const [editingLoading, setEditingLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [adminAccess, setAdminAccess] = useState(false);
  const [appAccess, setAppAccess] = useState(true);

  useEffect(() => {
    fetchRoles().catch(() => undefined);
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles/list", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setRoles(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const totalRoles = roles.length;
  const adminCount = useMemo(() => roles.filter((r) => r.admin_access).length, [roles]);
  const appCount = useMemo(() => roles.filter((r) => r.app_access).length, [roles]);
  const hasAdminRoles = adminCount > 0;

  const handleCreateRole = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const payload = {
        name: name.trim(),
        description: description || undefined,
        adminAccess,
        appAccess,
      };
      const res = await fetch("/api/admin/roles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error("Impossible de creer le role");
        return;
      }
      toast.success("Role cree");
      setName("");
      setDescription("");
      setAdminAccess(false);
      setAppAccess(true);
      setShowCreate(false);
      await fetchRoles();
    } catch {
      toast.error("Erreur reseau lors de la creation");
    } finally {
      setCreating(false);
    }
  };

  const handleSeedRoles = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/roles/seed", { method: "POST", cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Echec de la creation automatique");
        return;
      }
      const created = (json?.data?.created || []).length;
      toast.success(created ? `${created} role(s) ajoute(s)` : "Roles deja presents");
      await fetchRoles();
    } catch {
      toast.error("Erreur reseau lors de la creation automatique");
    } finally {
      setSeeding(false);
    }
  };

  const updateRole = async (
    roleId: string,
    patch: Partial<{ name: string; description: string | null; admin_access: boolean; app_access: boolean }>
  ) => {
    try {
      const res = await fetch("/api/admin/roles/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          roleId,
          name: patch.name ?? undefined,
          description: patch.description ?? undefined,
          adminAccess: patch.admin_access ?? undefined,
          appAccess: patch.app_access ?? undefined,
        }),
      });
      if (!res.ok) {
        toast.error("Echec de la mise a jour du role");
        return false;
      }
      await fetchRoles();
      return true;
    } catch {
      toast.error("Erreur reseau lors de la mise a jour");
      return false;
    }
  };

  const handleSaveAccess = async (roleId: string, access: { admin: boolean; app: boolean }) => {
    const success = await updateRole(roleId, {
      admin_access: access.admin,
      app_access: access.app,
    });
    if (success) toast.success("Acces mis a jour");
  };

  const openEditDialog = (role: Role) => {
    setEditingRole({
      id: role.id,
      name: role.name,
      description: role.description ?? "",
    });
  };

  const handleSaveEdition = async () => {
    if (!editingRole) return;
    setEditingLoading(true);
    const ok = await updateRole(editingRole.id, {
      name: editingRole.name.trim(),
      description: editingRole.description?.trim() || null,
    });
    setEditingLoading(false);
    if (ok) {
      toast.success("Role mis a jour");
      setEditingRole(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide opacity-60">
          <span className="flex items-center gap-1 text-[color:var(--foreground)]/60">
            <Shield className="h-4 w-4" />
            Admin
          </span>
          <ChevronRight className="h-3 w-3" />
          <span>Parametres</span>
          <ChevronRight className="h-3 w-3" />
          <span>Roles & acces</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Roles & acces</h1>
            <p className="text-sm opacity-70">
              Creez, editez ou ajustez les droits attribues aux roles Directus.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile icon={<UsersRound className="h-4 w-4" />} label="Roles" value={totalRoles} tone="indigo" />
          <StatTile icon={<Shield className="h-4 w-4" />} label="Acces admin" value={adminCount} tone="emerald" />
          <StatTile icon={<UsersRound className="h-4 w-4" />} label="Acces application" value={appCount} tone="sky" />
        </div>
      </header>

      <section className="rounded-xl border border-[color:var(--bg-700)]/45 bg-[color:var(--bg-700)]/35 backdrop-blur px-6 py-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.7)]">
        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div>
            <h2 className="text-lg font-semibold">Nouveau role</h2>
            <p className="text-sm opacity-70">Ajoutez un role puis choisissez les acces associes.</p>
          </div>
          <ChevronDown
            className={`h-5 w-5 opacity-70 transition-transform ${showCreate ? "rotate-180" : ""}`}
          />
        </button>

        {showCreate && (
          <div className="mt-4 grid gap-4 border-t border-[color:var(--bg-700)]/40 pt-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="roleName">Nom du role</Label>
              <Input
                id="roleName"
                placeholder="Ex. Responsable"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-[color:var(--bg-600)]/70 bg-[color:var(--bg-800)]/30 focus-visible:border-[color:var(--violet-400,#a855f7)]/60 focus-visible:ring-2 focus-visible:ring-[color:var(--violet-400,#a855f7)]/40"
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="roleDescription">Description</Label>
              <Input
                id="roleDescription"
                placeholder="Resume des responsabilites"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-[color:var(--bg-600)]/70 bg-[color:var(--bg-800)]/30 focus-visible:border-[color:var(--violet-400,#a855f7)]/60 focus-visible:ring-2 focus-visible:ring-[color:var(--violet-400,#a855f7)]/40"
              />
            </div>
            <div className="grid gap-3 sm:col-span-2">
              <ToggleRow
                label="Acces administrateur"
                helper="Donne la main sur tout le back-office."
                value={adminAccess}
                onChange={setAdminAccess}
              />
              <ToggleRow
                label="Acces application"
                helper="Autorise les outils applicatifs internes."
                value={appAccess}
                onChange={setAppAccess}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:col-span-2">
              <Button
                variant="secondary"
                onClick={handleSeedRoles}
                disabled={loading || seeding}
                aria-busy={seeding}
              >
                {seeding ? "Creation..." : "Roles par defaut"}
              </Button>
              <Button onClick={handleCreateRole} disabled={creating || !name.trim()} aria-busy={creating}>
                {creating ? "Enregistrement..." : "Creer le role"}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Roles existants</h2>
            <p className="text-sm opacity-70">
              Activez ou desactivez les acces en un clic, renommez et documentez les roles.
            </p>
          </div>
          <span className="text-xs uppercase tracking-wide opacity-60">
            {loading ? "Chargement..." : `${roles.length} role${roles.length > 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="space-y-4">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} onSaveAccess={handleSaveAccess} onEdit={openEditDialog} />
          ))}

          {!roles.length && !loading ? (
            <div className="rounded-lg border border-dashed border-[color:var(--bg-700)]/60 p-6 text-center text-sm opacity-70">
              Aucun role enregistre. Creez un nouveau role ou importez les roles par defaut.
            </div>
          ) : null}
        </div>
      </section>

      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-lg border border-[color:var(--bg-700)]/60 bg-[color:var(--bg-700)]/90 px-6 py-6 text-[color:var(--foreground)] shadow-[0_28px_75px_-42px_rgba(0,0,0,0.75)]">
          <DialogHeader>
            <DialogTitle>Renommer le role</DialogTitle>
            <DialogDescription>
              Modifiez le nom ou la description. Les acces restent geres depuis la liste principale.
            </DialogDescription>
          </DialogHeader>
          {editingRole ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editRoleName">Nom du role</Label>
                <Input
                  id="editRoleName"
                  value={editingRole.name}
                  onChange={(e) =>
                    setEditingRole((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                  className="border-[color:var(--bg-600)]/70 bg-[color:var(--bg-800)]/30 focus-visible:border-[color:var(--violet-400,#a855f7)]/60 focus-visible:ring-2 focus-visible:ring-[color:var(--violet-400,#a855f7)]/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRoleDescription">Description</Label>
                <Input
                  id="editRoleDescription"
                  value={editingRole.description ?? ""}
                  onChange={(e) =>
                    setEditingRole((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                  placeholder="Resume des responsabilites"
                  className="border-[color:var(--bg-600)]/70 bg-[color:var(--bg-800)]/30 focus-visible:border-[color:var(--violet-400,#a855f7)]/60 focus-visible:ring-2 focus-visible:ring-[color:var(--violet-400,#a855f7)]/40"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingRole(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdition} disabled={editingLoading || !editingRole?.name.trim()} aria-busy={editingLoading}>
              {editingLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!hasAdminRoles && !loading ? (
        <div className="rounded-md border border-amber-500/45 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Aucun role administrateur configure : activez l'acces admin sur au moins un role pour ne pas bloquer l'equipe.
        </div>
      ) : null}
    </div>
  );
}

function RoleCard({
  role,
  onSaveAccess,
  onEdit,
}: {
  role: Role;
  onSaveAccess: (roleId: string, access: { admin: boolean; app: boolean }) => Promise<void>;
  onEdit: (role: Role) => void;
}) {
  const [admin, setAdmin] = useState(!!role.admin_access);
  const [app, setApp] = useState(!!role.app_access);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAdmin(!!role.admin_access);
    setApp(!!role.app_access);
  }, [role.admin_access, role.app_access]);

  const dirty = admin !== !!role.admin_access || app !== !!role.app_access;

  const handleSave = async () => {
    setSaving(true);
    await onSaveAccess(role.id, { admin, app });
    setSaving(false);
  };

  const handleReset = () => {
    setAdmin(!!role.admin_access);
    setApp(!!role.app_access);
  };

  return (
    <article className="space-y-4 rounded-xl border border-[color:var(--bg-700)]/40 bg-[color:var(--bg-700)]/30 p-6 shadow-[0_24px_65px_-40px_rgba(0,0,0,0.65)] transition hover:border-[color:var(--bg-600)]/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold leading-tight">{role.name || "Sans nom"}</h3>
          <p className="text-sm opacity-70">
            {role.description || "Pas encore de description."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={role.admin_access ? "default" : "secondary"}>
            {role.admin_access ? "Acces admin" : "Pas d'acces admin"}
          </Badge>
          <Badge variant={role.app_access ? "outline" : "secondary"}>
            {role.app_access ? "Acces app" : "App desactivee"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleRow
          label="Activer l'acces admin"
          helper="Autorise la gestion du back-office."
          value={admin}
          onChange={setAdmin}
        />
        <ToggleRow
          label="Autoriser l'acces application"
          helper="Donne acces aux outils applicatifs."
          value={app}
          onChange={setApp}
        />
      </div>

      <div className="flex flex-col gap-2 text-xs opacity-60 sm:flex-row sm:items-center sm:justify-between">
        <span>ID : {role.id}</span>
        <div className="flex items-center gap-2">
          {dirty ? (
            <>
              <Button size="sm" variant="secondary" onClick={handleReset} disabled={saving}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} aria-busy={saving}>
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => onEdit(role)}>
              Renommer / description
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function ToggleRow({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--bg-700)]/25 bg-[color:var(--bg-700)]/30 px-4 py-3 shadow-[0_12px_32px_-28px_rgba(0,0,0,0.65)]">
      <div className="space-y-1">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {helper ? <p className="text-xs opacity-60">{helper}</p> : null}
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: StatTone;
  icon: React.ReactNode;
}) {
  const palette = STAT_STYLES[tone];
  return (
    <div className={`rounded-xl border border-[color:var(--bg-700)]/60 bg-gradient-to-br ${palette.bg} p-4 shadow-[0_16px_55px_-40px_rgba(0,0,0,0.6)]`}>
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[color:var(--foreground)]/60">
        <span>{label}</span>
        <span>{icon}</span>
      </div>
      <p className={`text-3xl font-semibold ${palette.text}`}>{value}</p>
    </div>
  );
}
