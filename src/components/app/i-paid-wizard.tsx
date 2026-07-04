"use client";

import { useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { useCreateExpense } from "@/lib/queries";
import { Sheet } from "@/components/app/sheet";
import { cn } from "@/lib/utils";

const inr = (n: number) => n.toLocaleString("en-IN");

const CATEGORIES: { v: string; label: string; emoji: string }[] = [
  { v: "groceries", label: "Groceries", emoji: "🛒" },
  { v: "electricity", label: "Electricity", emoji: "⚡" },
  { v: "water", label: "Water", emoji: "🚰" },
  { v: "internet", label: "Wifi", emoji: "📶" },
  { v: "gas", label: "Gas", emoji: "🔥" },
  { v: "house_help", label: "House help", emoji: "🧹" },
  { v: "cleaner", label: "Cleaner", emoji: "🧽" },
  { v: "brokerage", label: "Brokerage", emoji: "🧑‍💼" },
  { v: "misc", label: "Misc", emoji: "🧾" },
];

type Member = { memberId: number; name: string };
type SplitMode = "equal" | "percentage" | "custom";

function equalSplit(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

const fieldCls =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export function IPaidWizard({
  open, onClose, members, meId,
}: {
  open: boolean;
  onClose: () => void;
  members: Member[];
  meId: number | null;
}) {
  const create = useCreateExpense();
  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState("groceries");
  const [payerId, setPayerId] = useState<number | null>(meId);
  const [shared, setShared] = useState<Set<number>>(new Set(members.map((m) => m.memberId)));
  const [mode, setMode] = useState<SplitMode>("equal");
  const [custom, setCustom] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const amount = Math.round(Number(amountStr) || 0);
  const participants = useMemo(() => members.filter((m) => shared.has(m.memberId)), [members, shared]);

  const preview = useMemo<Record<number, number>>(() => {
    const out: Record<number, number> = {};
    if (amount <= 0 || participants.length === 0) return out;
    if (mode === "equal") {
      const parts = equalSplit(amount, participants.length);
      participants.forEach((m, i) => (out[m.memberId] = parts[i] ?? 0));
    } else if (mode === "percentage") {
      participants.forEach((m) => (out[m.memberId] = Math.round((amount * (Number(custom[m.memberId]) || 0)) / 100)));
    } else {
      participants.forEach((m) => (out[m.memberId] = Math.round(Number(custom[m.memberId]) || 0)));
    }
    return out;
  }, [amount, participants, mode, custom]);

  const previewTotal = Object.values(preview).reduce((s, n) => s + n, 0);
  const pctTotal = participants.reduce((s, m) => s + (Number(custom[m.memberId]) || 0), 0);
  const canSubmit =
    amount > 0 &&
    payerId != null &&
    participants.length > 0 &&
    (mode === "equal" ||
      (mode === "percentage" && pctTotal === 100) ||
      (mode === "custom" && previewTotal === amount));

  function toggle(id: number) {
    setShared((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setAmountStr(""); setCategory("groceries"); setPayerId(meId);
    setShared(new Set(members.map((m) => m.memberId))); setMode("equal"); setCustom({}); setError(null);
  }

  function submit() {
    if (!canSubmit || payerId == null) return;
    setError(null);
    const ids = participants.map((m) => m.memberId);
    let params: Record<string, unknown> | null = null;
    let strategy = "equal";
    if (mode === "percentage") {
      strategy = "percentage";
      params = { pct: Object.fromEntries(ids.map((id) => [id, Number(custom[id]) || 0])) };
    } else if (mode === "custom") {
      strategy = "custom";
      params = { amounts: Object.fromEntries(ids.map((id) => [id, Math.round(Number(custom[id]) || 0)])) };
    }
    create.mutate(
      { payerId, amount, category, strategy, params, participantIds: ids },
      {
        onSuccess: () => { reset(); onClose(); },
        onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't add that."),
      },
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="I paid for…">
      <div className="space-y-4">
        {/* amount */}
        <div className="text-center">
          <div className="inline-flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-muted-foreground">₹</span>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0"
              className="w-40 bg-transparent text-center font-heading text-4xl font-bold tabular-nums outline-none"
            />
          </div>
        </div>

        {/* category */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.v}
              type="button"
              onClick={() => setCategory(c.v)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                category === c.v ? "border-acid bg-primary/10 font-semibold" : "border-border",
              )}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* payer */}
        <label className="block">
          <span className="mb-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Paid by</span>
          <select value={payerId ?? ""} onChange={(e) => setPayerId(Number(e.target.value))} className={fieldCls}>
            {members.map((m) => (
              <option key={m.memberId} value={m.memberId}>{m.memberId === meId ? `${m.name} (you)` : m.name}</option>
            ))}
          </select>
        </label>

        {/* participants */}
        <div>
          <span className="mb-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Split between</span>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.memberId}
                type="button"
                onClick={() => toggle(m.memberId)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  shared.has(m.memberId) ? "border-acid bg-primary/10" : "border-border text-muted-foreground",
                )}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* split mode */}
        <div>
          <div className="grid grid-cols-3 gap-2">
            {(["equal", "percentage", "custom"] as const).map((mo) => (
              <button
                key={mo}
                type="button"
                onClick={() => setMode(mo)}
                className={cn(
                  "rounded-xl border py-2 text-xs font-medium",
                  mode === mo ? "border-acid bg-primary/10" : "border-border",
                )}
              >
                {mo === "equal" ? "Equally" : mo === "percentage" ? "By %" : "Exact ₹"}
              </button>
            ))}
          </div>

          {/* per-person preview / inputs */}
          <ul className="mt-3 space-y-1.5">
            {participants.map((m) => (
              <li key={m.memberId} className="flex items-center justify-between gap-3 text-sm">
                <span>{m.name}</span>
                {mode === "equal" ? (
                  <b className="tabular-nums">₹{inr(preview[m.memberId] ?? 0)}</b>
                ) : (
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={custom[m.memberId] ?? ""}
                      onChange={(e) => setCustom((c) => ({ ...c, [m.memberId]: e.target.value }))}
                      className={cn(fieldCls, "w-24 text-right")}
                    />
                    <span className="text-muted-foreground">{mode === "percentage" ? "%" : "₹"}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
          {mode === "percentage" && (
            <p className={cn("mt-2 text-right text-xs", pctTotal === 100 ? "text-muted-foreground" : "text-destructive")}>
              Total: {pctTotal}%
            </p>
          )}
          {mode === "custom" && (
            <p className={cn("mt-2 text-right text-xs", previewTotal === amount ? "text-muted-foreground" : "text-destructive")}>
              ₹{inr(previewTotal)} of ₹{inr(amount)}
            </p>
          )}
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || create.isPending}
          className="h-11 w-full rounded-full bg-primary font-semibold text-primary-foreground disabled:opacity-50"
        >
          {create.isPending ? "Adding…" : amount > 0 ? `Add ₹${inr(amount)} expense` : "Add expense"}
        </button>
      </div>
    </Sheet>
  );
}
