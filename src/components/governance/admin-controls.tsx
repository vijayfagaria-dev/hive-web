"use client";

import { useState } from "react";
import {
  useApproveProposal,
  useCancelProposal,
  useExtendProposal,
  useForceMergeProposal,
  useFreezeProposal,
  useRejectProposal,
  isResolved,
  type ProposalDetail,
} from "@/lib/governance";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

type Btn = {
  key: string;
  label: string;
  onClick: () => void;
  pending: boolean;
  confirm?: string;
  variant?: "primary" | "danger" | "neutral";
};

export function AdminControls({ proposal }: { proposal: ProposalDetail }) {
  const id = proposal.id;
  const approve = useApproveProposal(id);
  const reject = useRejectProposal(id);
  const extend = useExtendProposal(id);
  const freeze = useFreezeProposal(id);
  const forceMerge = useForceMergeProposal(id);
  const cancel = useCancelProposal(id);

  const [hours, setHours] = useState(24);
  const [err, setErr] = useState<string | null>(null);

  const { phase, frozen } = proposal;

  const run = (mutate: { mutate: (args: undefined, opts: { onError: (e: unknown) => void }) => void }) => {
    setErr(null);
    mutate.mutate(undefined, {
      onError: (e) => setErr(e instanceof ApiError ? e.message : "That action failed. Try again."),
    });
  };

  const buttons: Btn[] = [];

  if (phase === "review") {
    buttons.push({
      key: "approve",
      label: approve.isPending ? "Approving…" : "✅ Approve for voting",
      onClick: () => run(approve),
      pending: approve.isPending,
      variant: "primary",
    });
    buttons.push({
      key: "reject",
      label: reject.isPending ? "Rejecting…" : "🚫 Reject",
      onClick: () => run(reject),
      pending: reject.isPending,
      confirm: "Reject this proposal? It won't go to a vote.",
      variant: "danger",
    });
  }

  if (phase === "voting") {
    buttons.push({
      key: "freeze",
      label: frozen ? (freeze.isPending ? "Unfreezing…" : "☀︎ Unfreeze") : freeze.isPending ? "Freezing…" : "❄︎ Freeze",
      onClick: () => {
        setErr(null);
        freeze.mutate(!frozen, {
          onError: (e) => setErr(e instanceof ApiError ? e.message : "Couldn't change the freeze state."),
        });
      },
      pending: freeze.isPending,
      variant: "neutral",
    });
    buttons.push({
      key: "force-merge",
      label: forceMerge.isPending ? "Merging…" : "📖 Force-merge",
      onClick: () => run(forceMerge),
      pending: forceMerge.isPending,
      confirm: "Force-merge now? This closes voting and writes the rule into the book immediately.",
      variant: "danger",
    });
  }

  if (!isResolved(phase)) {
    buttons.push({
      key: "cancel",
      label: cancel.isPending ? "Cancelling…" : "🗑️ Cancel proposal",
      onClick: () => run(cancel),
      pending: cancel.isPending,
      confirm: "Cancel this proposal entirely? This can't be undone.",
      variant: "danger",
    });
  }

  const handle = (b: Btn) => {
    if (b.confirm && !window.confirm(b.confirm)) return;
    b.onClick();
  };

  const variantCls = (v: Btn["variant"]) =>
    v === "primary"
      ? "bg-primary text-primary-foreground glow-acid"
      : v === "danger"
        ? "border border-destructive/40 text-destructive hover:bg-destructive/10"
        : "border border-amber-500/40 text-amber-800 hover:bg-amber-400/10";

  return (
    <section className="rounded-2xl border border-amber-500/40 bg-amber-400/[0.06] p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-700">🛡️ Admin</p>
        {frozen && (
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-amber-800">
            ❄︎ Frozen
          </span>
        )}
      </div>

      {err && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {err}
        </p>
      )}

      {phase === "voting" && (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">Extend (hours)</span>
            <input
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 rounded-xl border border-input bg-card px-3 py-2 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </label>
          <button
            type="button"
            disabled={extend.isPending}
            onClick={() => {
              setErr(null);
              extend.mutate(hours, {
                onError: (e) => setErr(e instanceof ApiError ? e.message : "Couldn't extend voting."),
              });
            }}
            className="rounded-xl border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-400/10 disabled:opacity-60"
          >
            {extend.isPending ? "Extending…" : "⏱️ Extend"}
          </button>
        </div>
      )}

      {buttons.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {buttons.map((b) => (
            <button
              key={b.key}
              type="button"
              disabled={b.pending}
              onClick={() => handle(b)}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60",
                variantCls(b.variant),
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No admin actions for this phase.</p>
      )}
    </section>
  );
}
