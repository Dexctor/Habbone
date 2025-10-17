"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function ProfileTabs({
  friendsSlot,
  groupsSlot,
  badgesSlot,
  counts,
}: {
  friendsSlot?: React.ReactNode;
  groupsSlot?: React.ReactNode;
  badgesSlot?: React.ReactNode;
  counts?: { friends?: number; groups?: number; badges?: number };
}) {
  const f = typeof counts?.friends === "number" ? ` (${counts!.friends})` : "";
  const g = typeof counts?.groups === "number" ? ` (${counts!.groups})` : "";
  const b = typeof counts?.badges === "number" ? ` (${counts!.badges})` : "";

  return (
    <Card className="bg-[color:var(--bg-700)] border-[color:var(--bg-800)]">
      <CardContent className="p-3">
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="friends">Amis{f}</TabsTrigger>
            <TabsTrigger value="groups">Groupes{g}</TabsTrigger>
            <TabsTrigger value="badges">Badges{b}</TabsTrigger>
          </TabsList>
          <TabsContent value="friends" className="px-1 pt-3">
            {friendsSlot}
          </TabsContent>
          <TabsContent value="groups" className="px-1 pt-3">
            {groupsSlot}
          </TabsContent>
          <TabsContent value="badges" className="px-1 pt-3">
            {badgesSlot}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
