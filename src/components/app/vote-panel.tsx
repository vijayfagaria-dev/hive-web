"use client";

import type { ComplaintDetail } from "@/lib/api";
import { useVote } from "@/lib/queries";
import { cn } from "@/lib/utils";

function Bar({ label, value, pct, lime }: { label: string; value: number; pct: number; lime?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", lime ? "bg-primary" : "bg-foreground/40")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function VotePanel({ c }: { c: ComplaintDetail }) {
  const vote = useVote(c.id);
  const total = c.vote.uphold + c.vote.void;
  const upPct = total ? (c.vote.uphold / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Bar label="Uphold" value={c.vote.uphold} pct={upPct} lime />
        <Bar label="Void" value={c.vote.void} pct={total ? 100 - upPct : 0} />
        <p className="text-center font-mono text-xs text-muted-foreground">
          {total}/{c.vote.eligible} voted
        </p>
      </div>

      {c.canVote ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={vote.isPending}
            onClick={() => vote.mutate("uphold")}
            className={cn(
              "rounded-xl py-3 font-semibold transition disabled:opacity-50",
              c.vote.myVote === "uphold"
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-acid",
            )}
          >
            ⚖️ Uphold
          </button>
          <button
            type="button"
            disabled={vote.isPending}
            onClick={() => vote.mutate("void")}
            className={cn(
              "rounded-xl py-3 font-semibold transition disabled:opacity-50",
              c.vote.myVote === "void" ? "bg-foreground text-background" : "border border-border hover:border-foreground",
            )}
          >
            🚫 Void
          </button>
        </div>
      ) : c.vote.myVote ? (
        <p className="text-center text-sm text-muted-foreground">
          You voted to <b className="text-foreground">{c.vote.myVote}</b>.
        </p>
      ) : (
        <p className="text-center text-sm text-muted-foreground">You can&apos;t vote on this one.</p>
      )}
    </div>
  );
}
