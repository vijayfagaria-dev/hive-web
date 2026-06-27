"use client";

import { useState } from "react";
import { ApiError, type BillType } from "@/lib/api";
import { useCreateBill } from "@/lib/queries";
import { cn } from "@/lib/utils";

const TYPES: { v: BillType; l: string }[] = [
  { v: "rent", l: "🏠 Rent" },
  { v: "house_help", l: "🧹 House help" },
  { v: "electricity", l: "⚡ Electricity" },
  { v: "water", l: "🚰 Water" },
];

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const fieldCls =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export function BillCreateForm({ onDone }: { onDone: () => void }) {
  const create = useCreateBill();
  const [type, setType] = useState<BillType>("rent");
  const [total, setTotal] = useState("");
  const [month, setMonth] = useState(thisMonth());
  const [error, setError] = useState<string | null>(null);

  const amount = Number(total);
  const canSubmit = amount > 0 && !!month && !create.isPending;

  function submit() {
    if (!canSubmit) return;
    setError(null);
    create.mutate(
      { type, total: amount, month },
      {
        onSuccess: onDone,
        onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't create that bill."),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Type</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setType(t.v)}
              className={cn(
                "rounded-xl border py-2.5 text-sm font-medium transition-colors",
                type === t.v ? "border-acid bg-primary/10" : "border-border hover:border-acid/40",
              )}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Total ₹</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="8000"
            className={cn(fieldCls, "mt-2")}
          />
        </label>
        <label className="block">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Month</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={cn(fieldCls, "mt-2")} />
        </label>
      </div>

      <p className="rounded-xl bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
        You&apos;re recording that <b className="text-foreground">you paid this</b>. It splits across the
        current tenants and everyone gets a window to dispute before it&apos;s confirmed.
      </p>
      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="h-11 w-full rounded-full bg-primary font-semibold text-primary-foreground disabled:opacity-50"
      >
        {create.isPending ? "Recording…" : "I paid this — split it"}
      </button>
    </div>
  );
}
