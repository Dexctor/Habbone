"use client";

import { useState } from "react";
import AdminLists from "@/components/admin/AdminLists";
import AdminUsersPanel from "@/components/admin/AdminUsersPanel";
import AdminRolesPanel from "@/components/admin/AdminRolesPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Fn = (formData: FormData) => Promise<void>;

type SummaryStat = {
  label: string;
  value: number;
  caption?: string;
};

type AdminDashboardProps = {
  stats: SummaryStat[];
  topics: any[];
  posts: any[];
  news: any[];
  forumComments: any[];
  newsComments: any[];
  topicTitleById: Record<number, string>;
  updateTopic: Fn;
  deleteTopic: Fn;
  updatePost: Fn;
  deletePost: Fn;
  updateArticle: Fn;
  deleteArticle: Fn;
  updateForumComment: Fn;
  deleteForumComment: Fn;
  updateNewsComment: Fn;
  deleteNewsComment: Fn;
};

export default function AdminDashboard(props: AdminDashboardProps) {
  const {
    stats,
    topics,
    posts,
    news,
    forumComments,
    newsComments,
    topicTitleById,
    updateTopic,
    deleteTopic,
    updatePost,
    deletePost,
    updateArticle,
    deleteArticle,
    updateForumComment,
    deleteForumComment,
    updateNewsComment,
    deleteNewsComment,
  } = props;

  const [rolesModalOpen, setRolesModalOpen] = useState(false);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{"Vue d\u2019ensemble"}</h2>
          <p className="text-sm opacity-70">
            Un apercu instantane des volumes cles a surveiller au quotidien.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <SummaryCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Gestion des contenus</h2>
          <p className="text-sm opacity-70">
            Rechercher, modifier et moderer les sujets, articles et commentaires depuis une vue unifiee.
          </p>
        </div>
        <DashboardModule>
          <AdminLists
            topics={topics}
            posts={posts}
            news={news}
            forumComments={forumComments}
            newsComments={newsComments}
            topicTitleById={topicTitleById}
            updateTopic={updateTopic}
            deleteTopic={deleteTopic}
            updatePost={updatePost}
            deletePost={deletePost}
            updateArticle={updateArticle}
            deleteArticle={deleteArticle}
            updateForumComment={updateForumComment}
            deleteForumComment={deleteForumComment}
            updateNewsComment={updateNewsComment}
            deleteNewsComment={deleteNewsComment}
          />
        </DashboardModule>
      </section>

      <section className="space-y-8">
        <DashboardWithHeader
          title="Utilisateurs & affectations"
          description="Chercher un membre, verifier son statut et ajuster son role en quelques clics."
        >
          <AdminUsersPanel onOpenRoles={() => setRolesModalOpen(true)} />
        </DashboardWithHeader>
      </section>

      <Dialog open={rolesModalOpen} onOpenChange={setRolesModalOpen}>
        <DialogContent className="max-w-4xl overflow-hidden border border-[color:var(--bg-700)]/50 bg-gradient-to-br from-[color:var(--bg-700)] via-[color:var(--bg-600)] to-[color:var(--bg-800)] px-8 pb-8 pt-7 text-[color:var(--foreground)] shadow-[0_40px_90px_-45px_rgba(0,0,0,0.75)] backdrop-blur data-[state=open]:duration-300 data-[state=closed]:duration-200">
          <DialogHeader>
            <DialogTitle>Gestion des roles & acces</DialogTitle>
            <DialogDescription>
              Creez, editez ou ajustez les acces admin et application attribues aux roles Directus.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <AdminRolesPanel />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard(stat: SummaryStat) {
  return (
    <Card className="border-[color:var(--bg-800)] bg-[color:var(--bg-600)] shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium opacity-75">{stat.label}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <span className="text-3xl font-semibold">{stat.value}</span>
        {stat.caption ? <span className="text-xs opacity-60">{stat.caption}</span> : null}
      </CardContent>
    </Card>
  );
}

function DashboardModule({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-[color:var(--bg-800)] bg-[color:var(--bg-600)] shadow-sm">
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function DashboardWithHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-[color:var(--bg-800)] bg-[color:var(--bg-600)] shadow-sm",
        className,
      )}
    >
      <CardHeader className="space-y-1 border-b border-[color:var(--bg-700)]/70">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description ? <p className="text-sm opacity-70">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        <div className="p-4 sm:p-6">{children}</div>
      </CardContent>
    </Card>
  );
}
