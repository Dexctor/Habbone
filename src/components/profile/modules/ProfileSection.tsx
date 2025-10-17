"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProfileSection({ title, onPrev, onNext, children }: { title: string; onPrev?: () => void; onNext?: () => void; children: React.ReactNode }) {
  return (
    <Card className="bg-[color:var(--bg-600)] border-[color:var(--bg-800)]">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {(onPrev || onNext) && (
          <div className="flex items-center gap-2">
            {onPrev && (
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10"
                title="Précédent"
                aria-label="Précédent"
                onClick={onPrev}
              >
                <ChevronLeft className="size-5" />
              </Button>
            )}
            {onNext && (
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10"
                title="Suivant"
                aria-label="Suivant"
                onClick={onNext}
              >
                <ChevronRight className="size-5" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

