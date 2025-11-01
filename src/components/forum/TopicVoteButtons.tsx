"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

type Props = {
  topicId: number;
  initial?: { up: number; down: number };
  canVote?: boolean;
};

export default function TopicVoteButtons({ topicId, initial, canVote = false }: Props) {
  const [counts, setCounts] = useState<{ up: number; down: number }>({
    up: Number(initial?.up ?? 0),
    down: Number(initial?.down ?? 0),
  });
  const [busy, setBusy] = useState<1 | -1 | 0>(0);

  const vote = async (val: 1 | -1) => {
    if (!canVote || busy) return;
    setBusy(val);
    try {
      const res = await fetch(`/api/forum/topics/${topicId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: val }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json && json.error) || "VOTE_FAILED");
      const summary = (json && json.summary) || { up: 0, down: 0 };
      setCounts({ up: Number(summary.up || 0), down: Number(summary.down || 0) });
    } catch (e: any) {
      toast.error(e?.message || "Action impossible");
    } finally {
      setBusy(0);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => vote(1)}
        disabled={!canVote || busy === 1}
        className="inline-flex h-9 items-center gap-1 rounded-md border border-black/15 bg-green-600 px-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
        aria-label="Aimer le sujet"
      >
        <ThumbsUp className="h-4 w-4" /> {counts.up}
      </button>
      <button
        type="button"
        onClick={() => vote(-1)}
        disabled={!canVote || busy === -1}
        className="inline-flex h-9 items-center gap-1 rounded-md border border-black/15 bg-red-600 px-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
        aria-label="Ne pas aimer le sujet"
      >
        <ThumbsDown className="h-4 w-4" /> {counts.down}
      </button>
    </div>
  );
}

