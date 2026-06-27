"use client";

import { useState } from "react";
import { ApiError, type DashboardBill } from "@/lib/api";
import { useDisputeBill } from "@/lib/queries";
import { Sheet } from "@/components/app/sheet";
import { cn } from "@/lib/utils";

const inr = (n: number) => n.toLocaleString("en-IN");

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  rent: { emoji: "🏠", label: "Rent" },
  house_help: { emoji: "🧹", label: "House help" },
  electricity: { emoji: "⚡", label: "Electricity" },
  water: { emoji: "🚰", label: "Water" },
};

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending confirmation", cls: "bg-amber-500/15 text-amber-600" },
  confirmed: { label: "Confirmed", cls: "bg-primary/15 text-acid" },
  disputed: { label: "Disputed", cls: "bg-destructive/15 text-destructive" },
};

function countdown(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "any moment now";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function BillsList({ bills }: { bills: DashboardBill[] }) {
  const dispute = useDisputeBill();
  const [target, setTarget] = useState<DashboardBill | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <ul className="space-y-2">
        {bills.map((b) => {
          const t = TYPE_META[b.type] ?? { emoji: "🧾", label: b.type };
          const chip = STATUS_CHIP[b.status] ?? { label: b.status, cls: "bg-muted text-muted-foreground" };
          return (
            <li key={b.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                  {t.emoji} {t.label} — <b className="tabular-nums">₹{inr(b.total)}</b>
                </span>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", chip.cls)}>
                  {chip.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Claimed by {b.claimedBy ?? "—"} · {b.month}
                {b.status === "pending" && b.confirmDeadline ? ` · auto-confirms in ${countdown(b.confirmDeadline)}` : ""}
                {b.status === "disputed" && b.disputedBy ? ` · disputed by ${b.disputedBy}` : ""}
              </p>
              {b.status === "disputed" && b.disputeReason && (
                <p className="mt-1 text-sm italic text-muted-foreground">“{b.disputeReason}”</p>
              )}
              {b.canDispute && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setReason("");
                    setTarget(b);
                  }}
                  className="mt-3 rounded-full border border-border px-4 py-1.5 text-sm font-medium"
                >
                  Dispute
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <Sheet open={!!target} onClose={() => setTarget(null)} title="Dispute this bill?">
        {target && (
          <>
            <p className="text-sm">
              Tell the flat why the {(TYPE_META[target.type]?.label ?? target.type).toLowerCase()} claim looks wrong.
              It won&apos;t auto-confirm until it&apos;s sorted out.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="optional — what's off?"
              className="mt-3 w-full rounded-xl border border-input bg-card p-3 text-sm outline-none focus-visible:border-ring"
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setTarget(null)} className="rounded-xl border border-border py-3 text-sm font-medium">
                Cancel
              </button>
              <button
                type="button"
                disabled={dispute.isPending}
                onClick={() =>
                  dispute.mutate(
                    { billId: target.id, reason: reason.trim() || undefined },
                    {
                      onSuccess: () => setTarget(null),
                      onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't dispute that."),
                    },
                  )
                }
                className="rounded-xl bg-destructive py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {dispute.isPending ? "…" : "Dispute it"}
              </button>
            </div>
          </>
        )}
      </Sheet>
    </>
  );
}
