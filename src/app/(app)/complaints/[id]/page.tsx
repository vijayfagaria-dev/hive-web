"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ApiError, type Phase } from "@/lib/api";
import { useAccept, useComplaint, useDispute } from "@/lib/queries";
import { Avatar } from "@/components/app/avatar";
import { PhaseChip } from "@/components/app/phase-chip";
import { ProofGallery } from "@/components/app/proof-gallery";
import { StatusTracker } from "@/components/app/status-tracker";
import { VotePanel } from "@/components/app/vote-panel";
import { VoteCountdown } from "@/components/app/vote-countdown";
import { ConfettiBurst } from "@/components/app/confetti-burst";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const BANNER: Record<Phase, { cls: string; emoji: string }> = {
  raised: { cls: "bg-amber-400/12 text-amber-800", emoji: "⏳" },
  voting: { cls: "bg-violet-400/12 text-violet-800", emoji: "🗳️" },
  registered: { cls: "bg-primary/15 text-lime-800", emoji: "✅" },
  rejected: { cls: "bg-muted text-muted-foreground", emoji: "⚖️" },
};

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5">
      {title && <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>}
      {children}
    </section>
  );
}

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: c, isPending, isError, error, refetch } = useComplaint(id);
  const accept = useAccept(id);
  const dispute = useDispute(id);

  const [showDeny, setShowDeny] = useState(false);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (isPending) {
    return (
      <main className="mx-auto max-w-xl space-y-4 px-5 py-8">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </main>
    );
  }
  if (isError || !c) {
    const msg = error instanceof ApiError && error.status === 404 ? "No such complaint." : "Couldn't load this complaint.";
    return (
      <EmptyState
        emoji="🤷"
        title={msg}
        note="It may have been dropped, or the link is off."
        action={
          <Link href="/dashboard" className="rounded-full border border-border px-4 py-2 text-sm">
            Back
          </Link>
        }
        className="min-h-[60svh]"
      />
    );
  }

  const banner = BANNER[c.phase];
  const ruleLabel = c.rule ?? "ad-hoc fine";
  const onAct = (fn: () => void) => {
    setActionError(null);
    fn();
  };

  return (
    <main className="mx-auto max-w-xl space-y-5 px-5 py-8">
      <ConfettiBurst fire={c.phase === "registered"} />

      {/* header */}
      <div className="flex items-center gap-3">
        <Avatar name={c.accused?.name ?? "?"} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{c.accused?.name ?? "Someone"}</p>
          <p className="truncate text-sm text-muted-foreground">{ruleLabel}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-xl font-bold tabular-nums">₹{c.amount}</p>
          <PhaseChip phase={c.phase} />
        </div>
      </div>

      {/* status banner */}
      <div className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium", banner.cls)}>
        <span className="text-lg" aria-hidden>{banner.emoji}</span>
        <span className="flex-1">
          {c.phase === "raised" && (
            <>
              Awaiting {c.accused?.name ?? "the accused"} ·{" "}
              {c.coolingDeadline ? (
                <VoteCountdown deadline={c.coolingDeadline} onExpire={() => refetch()} prefix="auto-confirms in" />
              ) : (
                "cooling"
              )}
            </>
          )}
          {c.phase === "voting" && (
            <>
              The flat is voting ·{" "}
              {c.voteDeadline ? (
                <VoteCountdown deadline={c.voteDeadline} onExpire={() => refetch()} prefix="closes in" />
              ) : (
                "open"
              )}
            </>
          )}
          {c.phase === "registered" && <>It stands — ₹{c.amount} into the jar. {c.paid ? "Paid 🎉" : "🎉"}</>}
          {c.phase === "rejected" && <>Dropped — no fine.</>}
        </span>
      </div>

      {/* proof */}
      {c.proofs.length > 0 && (
        <Card title="Proof">
          <ProofGallery proofs={c.proofs} />
        </Card>
      )}

      {c.disputeReason && (
        <Card title="Denial reason">
          <p className="text-sm">{c.disputeReason}</p>
        </Card>
      )}

      {/* vote */}
      {(c.phase === "voting" || c.vote.uphold + c.vote.void > 0) && (
        <Card title="The vote">
          <VotePanel c={c} />
        </Card>
      )}

      {/* contextual actions (raised) */}
      {(c.canAccept || c.canDispute) && (
        <Card>
          {actionError && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>}
          {showDeny ? (
            <div className="space-y-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Why is this wrong? (optional — opens a flat vote)"
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeny(false)}
                  className="rounded-xl border border-border py-3 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={dispute.isPending}
                  onClick={() =>
                    onAct(() =>
                      dispute.mutate(reason.trim() || undefined, {
                        onSuccess: () => setShowDeny(false),
                        onError: (e) =>
                          setActionError(e instanceof ApiError ? e.message : "Couldn't deny that."),
                      }),
                    )
                  }
                  className="rounded-xl bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
                >
                  {dispute.isPending ? "Opening vote…" : "Confirm deny"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {c.canAccept && (
                <button
                  type="button"
                  disabled={accept.isPending}
                  onClick={() =>
                    onAct(() =>
                      accept.mutate(undefined, {
                        onError: (e) =>
                          setActionError(e instanceof ApiError ? e.message : "Couldn't accept that."),
                      }),
                    )
                  }
                  className="rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {accept.isPending ? "…" : "✅ Accept"}
                </button>
              )}
              {c.canDispute && (
                <button
                  type="button"
                  onClick={() => setShowDeny(true)}
                  className={cn(
                    "rounded-xl border border-border py-3 font-semibold hover:border-foreground",
                    !c.canAccept && "col-span-2",
                  )}
                >
                  🙅 Deny
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* timeline */}
      {c.timeline.length > 0 && (
        <Card title="Timeline">
          <StatusTracker timeline={c.timeline} />
        </Card>
      )}

      {c.accuser && (
        <p className="text-center font-mono text-xs text-muted-foreground">Filed by {c.accuser.name}</p>
      )}
    </main>
  );
}
