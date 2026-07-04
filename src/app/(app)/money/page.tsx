"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import {
  useAddCharge,
  useAddCredit,
  useAuth,
  useBalances,
  useCloseSettlement,
  useMyMoney,
  useSetRentShares,
} from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const inr = (n: number) => n.toLocaleString("en-IN");

const LEDGER_META: Record<string, { emoji: string; label: string }> = {
  advance: { emoji: "💰", label: "Advance" },
  deposit: { emoji: "🏦", label: "Deposit" },
  broker: { emoji: "🧑‍💼", label: "Broker" },
  penalty: { emoji: "⚖️", label: "Penalty" },
  payout: { emoji: "🎁", label: "Pot payout" },
  adjustment: { emoji: "✏️", label: "Adjustment" },
};

function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5">
      {title && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {action}
        </div>
      )}
      <div className={title ? "mt-3" : ""}>{children}</div>
    </section>
  );
}

const fieldCls =
  "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export default function MoneyPage() {
  const me = useAuth().data?.member ?? null;
  const isTenant = me?.role === "tenant";
  const { data, isPending } = useMyMoney();

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 py-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">The ledger</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">💸 My Money</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything you owe or are owed — and exactly why.</p>
      </header>

      {isPending || !data ? (
        <Skeleton className="h-44 w-full rounded-2xl" />
      ) : (
        <>
          {/* The one honest number */}
          <section
            className={cn(
              "rounded-2xl p-6 text-center",
              data.net < 0 ? "glass" : data.net > 0 ? "bg-primary/10 border border-primary/30" : "glass",
            )}
          >
            {data.net < 0 ? (
              <>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">You owe the flat</p>
                <p className="mt-2 font-heading text-5xl font-bold tabular-nums text-destructive">₹{inr(data.owes)}</p>
              </>
            ) : data.net > 0 ? (
              <>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">The flat owes you</p>
                <p className="mt-2 font-heading text-5xl font-bold tabular-nums text-acid">₹{inr(data.owed)}</p>
              </>
            ) : (
              <>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">You&apos;re all square</p>
                <p className="mt-2 font-heading text-5xl font-bold tabular-nums">₹0</p>
              </>
            )}
            {data.rentSharePct != null && (
              <p className="mt-3 text-xs text-muted-foreground">Your rent share: {data.rentSharePct}%</p>
            )}
          </section>

          {/* Why — unpaid fines */}
          {data.fines.length > 0 && (
            <Card title="Your unpaid fines">
              <ul className="space-y-2">
                {data.fines.map((f) => (
                  <li key={`fine-${f.id}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">🚨 {f.rule ?? "Fine"}</span>
                    <b className="tabular-nums">₹{inr(f.amount)}</b>
                  </li>
                ))}
              </ul>
              {data.finesOwed > 0 && (
                <Link
                  href="/pay"
                  className="mt-4 flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Pay your fines (₹{inr(data.finesOwed)}) →
                </Link>
              )}
            </Card>
          )}

          {/* Shared expenses — the expense component now folded into your net */}
          {(data.expensesPaid > 0 || data.expenseShare > 0) && (
            <Card title="Shared expenses">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">🧾 You paid for the flat</span>
                  <b className="tabular-nums text-acid">+₹{inr(data.expensesPaid)}</b>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">🍽️ Your share of expenses</span>
                  <b className="tabular-nums text-destructive">−₹{inr(data.expenseShare)}</b>
                </li>
              </ul>
              <Link
                href="/expenses"
                className="mt-4 flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-medium"
              >
                Open expenses & settle up →
              </Link>
            </Card>
          )}

          {/* The ledger — advances, broker, deposit, payouts, penalties */}
          {data.ledger.length > 0 && (
            <Card title="Advances, broker & settlements">
              <ul className="space-y-2">
                {data.ledger.map((e) => {
                  const m = LEDGER_META[e.type] ?? { emoji: "•", label: e.type };
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate">
                        <span aria-hidden>{m.emoji}</span> {e.reason}
                      </span>
                      <b className={cn("tabular-nums", e.amount >= 0 ? "text-acid" : "text-destructive")}>
                        {e.amount >= 0 ? "+" : "−"}₹{inr(Math.abs(e.amount))}
                      </b>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                + means the flat owes you · − means you owe the flat.
              </p>
            </Card>
          )}

          {data.fines.length === 0 &&
            data.ledger.length === 0 &&
            data.expensesPaid === 0 &&
            data.expenseShare === 0 && (
              <Card>
                <p className="text-center text-sm text-muted-foreground">Nothing on your ledger yet. 🎉</p>
              </Card>
            )}

          {isTenant && <AdminPanel />}
        </>
      )}
    </main>
  );
}

// ─── Admin (tenants) ───
function AdminPanel() {
  return (
    <div className="space-y-6 border-t border-border pt-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-acid">Admin · the flat&apos;s money</p>
      <RentSharesCard />
      <SettlementCard />
      <AddMoneyCard />
      <BalancesCard />
    </div>
  );
}

function RentSharesCard() {
  const balances = useBalances();
  const tenants = (balances.data?.balances ?? []).filter((b) => b.role === "tenant");
  const save = useSetRentShares();
  const [shares, setShares] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tenants.length && Object.keys(shares).length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seed from async-loaded balances once
      setShares(Object.fromEntries(tenants.map((t) => [t.memberId, String(t.rentSharePct ?? "")])));
    }
  }, [tenants, shares]);

  const total = tenants.reduce((s, t) => s + (Number(shares[t.memberId]) || 0), 0);

  function submit() {
    setMsg(null);
    const payload = Object.fromEntries(tenants.map((t) => [t.memberId, Number(shares[t.memberId]) || 0]));
    save.mutate(payload as unknown as Record<number, number>, {
      onSuccess: () => setMsg("Saved ✅"),
      onError: (e) => setMsg(e instanceof ApiError ? e.message : "Couldn't save."),
    });
  }

  return (
    <Card title="Rent shares">
      <p className="mb-3 text-sm text-muted-foreground">
        Rent splits by these %. Other bills (wifi, electricity, house help) always split equally. Must total 100%.
      </p>
      <div className="space-y-2">
        {tenants.map((t) => (
          <label key={t.memberId} className="flex items-center justify-between gap-3">
            <span className="text-sm">{t.name}</span>
            <span className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={shares[t.memberId] ?? ""}
                onChange={(e) => setShares((s) => ({ ...s, [t.memberId]: e.target.value }))}
                className={cn(fieldCls, "w-20 text-right")}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className={cn("text-sm font-semibold tabular-nums", total === 100 ? "text-acid" : "text-destructive")}>
          Total: {total}%
        </span>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
          <button
            type="button"
            onClick={submit}
            disabled={total !== 100 || save.isPending}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save shares"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function SettlementCard() {
  const [open, setOpen] = useState(false);
  const preview = useQuery({ queryKey: ["settlement-preview"], queryFn: api.settlementPreview, enabled: open });
  const close = useCloseSettlement();
  const [msg, setMsg] = useState<string | null>(null);
  const p = preview.data;

  return (
    <Card
      title="2-month settlement"
      action={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="font-mono text-xs uppercase tracking-wider text-acid hover:underline"
        >
          {open ? "Hide" : "Preview"}
        </button>
      }
    >
      <p className="text-sm text-muted-foreground">
        The fine pot goes toward rent; leftover is split back by rent share. Unpaid fines trigger a penalty.
      </p>
      {open && (
        <div className="mt-4">
          {preview.isPending || !p ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["Pot collected", p.pot],
                  ["→ Rent", p.appliedToRent],
                  ["Leftover", p.leftover],
                ].map(([label, val]) => (
                  <div key={label as string} className="rounded-xl border border-border bg-card p-3">
                    <dt className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-semibold tabular-nums">₹{inr(val as number)}</dd>
                  </div>
                ))}
              </dl>
              {p.payouts.length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="font-medium">Leftover split back:</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {p.payouts.map((x) => (
                      <li key={x.memberId} className="flex justify-between">
                        <span>{x.name}</span> <b className="tabular-nums text-acid">+₹{inr(x.amount)}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {p.penalties.map((pen) => (
                <div key={pen.defaulterId} className="mt-3 rounded-xl bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive">
                    ⚖️ {pen.defaulterName} — penalty ₹{inr(pen.amount)} (unpaid ₹{inr(pen.unpaid)})
                  </p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {pen.credits.map((c) => (
                      <li key={c.memberId} className="flex justify-between">
                        <span>{c.name}</span> <b className="tabular-nums text-acid">+₹{inr(c.amount)}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
              <button
                type="button"
                disabled={close.isPending}
                onClick={() =>
                  close.mutate(undefined, {
                    onSuccess: () => {
                      setMsg("Settled ✅");
                      preview.refetch();
                    },
                    onError: (e) => setMsg(e instanceof ApiError ? e.message : "Couldn't settle."),
                  })
                }
                className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {close.isPending ? "Settling…" : "Close this period & record it"}
              </button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function AddMoneyCard() {
  const balances = useBalances();
  const tenants = (balances.data?.balances ?? []).filter((b) => b.role === "tenant");
  const charge = useAddCharge();
  const credit = useAddCredit();
  const [mode, setMode] = useState<"charge" | "credit">("charge");
  const [type, setType] = useState("broker");
  const [total, setTotal] = useState("");
  const [memberId, setMemberId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [split, setSplit] = useState("ratio");
  const [msg, setMsg] = useState<string | null>(null);

  function submit() {
    setMsg(null);
    const amount = Number(total);
    if (!(amount > 0) || !reason.trim()) return;
    const onDone = {
      onSuccess: () => {
        setMsg("Recorded ✅");
        setTotal("");
        setReason("");
      },
      onError: (e: unknown) => setMsg(e instanceof ApiError ? e.message : "Couldn't record."),
    };
    if (mode === "charge") {
      charge.mutate({ type, total: amount, reason: reason.trim(), split }, onDone);
    } else {
      if (!memberId) return;
      credit.mutate({ memberId: Number(memberId), type: "advance", amount, reason: reason.trim() }, onDone);
    }
  }

  return (
    <Card title="Record money">
      <div className="mb-3 grid grid-cols-2 gap-2">
        {(["charge", "credit"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-xl border py-2 text-sm font-medium",
              mode === m ? "border-acid bg-primary/10" : "border-border",
            )}
          >
            {m === "charge" ? "Charge everyone" : "Credit someone"}
          </button>
        ))}
      </div>
      {mode === "charge" ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className={fieldCls}>
              <option value="broker">Broker</option>
              <option value="deposit">Deposit</option>
            </select>
            <select value={split} onChange={(e) => setSplit(e.target.value)} className={fieldCls}>
              <option value="ratio">Split by rent ratio</option>
              <option value="equal">Split equally</option>
            </select>
          </div>
          <input type="number" min={1} inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Total ₹" className={fieldCls} />
        </div>
      ) : (
        <div className="space-y-2">
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className={fieldCls}>
            <option value="">— who paid? —</option>
            {tenants.map((t) => (
              <option key={t.memberId} value={t.memberId}>{t.name}</option>
            ))}
          </select>
          <input type="number" min={1} inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Amount ₹ (advance / payment)" className={fieldCls} />
        </div>
      )}
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (e.g. Broker fee)" className={cn(fieldCls, "mt-2")} />
      <div className="mt-3 flex items-center justify-end gap-3">
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        <button
          type="button"
          onClick={submit}
          disabled={charge.isPending || credit.isPending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Record
        </button>
      </div>
    </Card>
  );
}

function BalancesCard() {
  const balances = useBalances();
  const rows = balances.data?.balances ?? [];
  if (!rows.length) return null;
  return (
    <Card title="Who's up, who's down">
      <ul className="space-y-2">
        {rows.map((b) => (
          <li key={b.memberId} className="flex items-center justify-between gap-3 text-sm">
            <span>
              {b.name}
              {b.rentSharePct != null && <span className="text-muted-foreground"> · {b.rentSharePct}%</span>}
            </span>
            <b className={cn("tabular-nums", b.net < 0 ? "text-destructive" : b.net > 0 ? "text-acid" : "")}>
              {b.net < 0 ? `owes ₹${inr(-b.net)}` : b.net > 0 ? `+₹${inr(b.net)}` : "₹0"}
            </b>
          </li>
        ))}
      </ul>
    </Card>
  );
}
