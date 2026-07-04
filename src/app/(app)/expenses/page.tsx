"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  useAuth,
  useDeleteExpense,
  useExpenses,
  useMemberBalances,
  useMyBalance,
  useRecordPayment,
  useRecordRent,
  useRentStatus,
  useSettlePreview,
} from "@/lib/queries";
import { IPaidWizard } from "@/components/app/i-paid-wizard";
import { RecurringTab } from "@/components/app/recurring-tab";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const inr = (n: number) => n.toLocaleString("en-IN");
const thisMonth = () => new Date().toISOString().slice(0, 7);

const CAT_EMOJI: Record<string, string> = {
  rent: "🏠", maintenance: "🔧", internet: "📶", house_help: "🧹",
  cook: "🍳", groceries: "🛒", broker: "🧑‍💼", misc: "🧾",
};

type Tab = "expenses" | "settle" | "rent" | "recurring";

export default function ExpensesPage() {
  const me = useAuth().data?.member ?? null;
  const isTenant = me?.role === "tenant";
  const bal = useMyBalance();
  const memberBalances = useMemberBalances();
  const members = (memberBalances.data?.balances ?? []).map((b) => ({ memberId: b.memberId, name: b.name }));
  const [tab, setTab] = useState<Tab>("expenses");
  const [wizard, setWizard] = useState(false);

  return (
    <main className="mx-auto max-w-xl space-y-5 px-5 py-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">The flat&apos;s money</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">💸 Expenses</h1>
      </header>

      {/* balance headline */}
      {bal.isPending || !bal.data ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : (
        <section
          className={cn(
            "rounded-2xl p-5 text-center",
            bal.data.net < 0 ? "glass" : bal.data.net > 0 ? "border border-primary/30 bg-primary/10" : "glass",
          )}
        >
          {bal.data.net < 0 ? (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">You owe overall</p>
              <p className="mt-1 font-heading text-4xl font-bold tabular-nums text-destructive">₹{inr(bal.data.owes)}</p>
            </>
          ) : bal.data.net > 0 ? (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">You&apos;re owed overall</p>
              <p className="mt-1 font-heading text-4xl font-bold tabular-nums text-acid">₹{inr(bal.data.owed)}</p>
            </>
          ) : (
            <p className="font-heading text-3xl font-bold">All square 🎉</p>
          )}
        </section>
      )}

      {isTenant && (
        <button
          type="button"
          onClick={() => setWizard(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground glow-acid"
        >
          <Plus className="size-5" /> I paid for something
        </button>
      )}

      {/* tabs */}
      <div className="grid grid-cols-4 gap-2">
        {(["expenses", "settle", "rent", "recurring"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl border py-2 text-xs font-medium capitalize",
              tab === t ? "border-acid bg-primary/10" : "border-border",
            )}
          >
            {t === "settle" ? "Settle" : t}
          </button>
        ))}
      </div>

      {tab === "expenses" && <ExpensesTab isTenant={isTenant} />}
      {tab === "settle" && <SettleTab meId={me?.id ?? null} />}
      {tab === "rent" && <RentTab members={members} isTenant={isTenant} />}
      {tab === "recurring" && <RecurringTab members={members} meId={me?.id ?? null} isTenant={isTenant} />}

      <IPaidWizard open={wizard} onClose={() => setWizard(false)} members={members} meId={me?.id ?? null} />
    </main>
  );
}

function ExpensesTab({ isTenant }: { isTenant: boolean }) {
  const { data, isPending } = useExpenses();
  const del = useDeleteExpense();
  if (isPending || !data) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (!data.expenses.length)
    return <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No expenses yet — tap the I-paid button above.</p>;
  return (
    <ul className="space-y-2">
      {data.expenses.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {CAT_EMOJI[e.category] ?? "🧾"} {e.payerName} paid <b className="tabular-nums">₹{inr(e.amount)}</b>
            </p>
            <p className="text-xs text-muted-foreground">
              {e.description || e.category} · {e.month}
              {e.status === "void" ? " · deleted" : ""}
            </p>
          </div>
          {isTenant && e.status !== "void" && (
            <button
              type="button"
              onClick={() => del.mutate(e.id)}
              className="shrink-0 rounded-full p-2 text-muted-foreground hover:text-destructive"
              aria-label="Delete expense"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function SettleTab({ meId }: { meId: number | null }) {
  const { data, isPending } = useSettlePreview();
  const pay = useRecordPayment();
  if (isPending || !data) return <Skeleton className="h-40 w-full rounded-2xl" />;
  const board = data.balances.filter((b) => b.net !== 0);
  return (
    <div className="space-y-3">
      {board.length > 0 && (
        <section className="glass rounded-2xl p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Where everyone stands</p>
          <ul className="space-y-1.5">
            {board.map((b) => (
              <li key={b.memberId} className="flex items-center justify-between text-sm">
                <span>{b.name}</span>
                <b className={cn("tabular-nums", b.net < 0 ? "text-destructive" : "text-acid")}>
                  {b.net < 0 ? `owes ₹${inr(-b.net)}` : `gets ₹${inr(b.net)}`}
                </b>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!data.transfers.length ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Everyone&apos;s square. Nothing to settle. 🎉</p>
      ) : (
      <p className="text-center text-sm text-muted-foreground">
        The fastest way to settle: <b className="text-foreground">{data.transfers.length} transfer{data.transfers.length > 1 ? "s" : ""}</b>.
      </p>
      )}
      <ul className="space-y-2">
        {data.transfers.map((t, i) => {
          const iOwe = t.fromId === meId;
          const owedToMe = t.toId === meId;
          return (
            <li key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <span className="text-sm">
                {iOwe ? (
                  <>You → <b>{t.toName}</b></>
                ) : owedToMe ? (
                  <><b>{t.fromName}</b> → you</>
                ) : (
                  <><b>{t.fromName}</b> → <b>{t.toName}</b></>
                )}
                <span className="ml-2 font-semibold tabular-nums">₹{inr(t.amount)}</span>
              </span>
              {iOwe && (
                <button
                  type="button"
                  disabled={pay.isPending}
                  onClick={() => pay.mutate({ fromId: t.fromId, toId: t.toId, amount: t.amount, note: "settle up" })}
                  className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Mark paid
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RentTab({ members, isTenant }: { members: { memberId: number; name: string }[]; isTenant: boolean }) {
  const month = thisMonth();
  const { data, isPending } = useRentStatus(month);
  const rec = useRecordRent();
  const [who, setWho] = useState<string>("");
  const [amt, setAmt] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  if (isPending || !data) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (!data.target)
    return <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Rent target isn&apos;t set up yet.</p>;

  const pct = Math.min(100, Math.round((data.collected / data.target) * 100));
  return (
    <div className="space-y-4">
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Rent · {month}</span>
          <span className={cn("font-semibold", data.complete ? "text-acid" : "text-muted-foreground")}>
            ₹{inr(data.collected)} / ₹{inr(data.target)}
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full", data.complete ? "bg-acid" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {data.complete ? "Rent complete for the month 🎉" : `₹${inr(data.remaining)} still to collect.`}
        </p>
        <ul className="mt-3 space-y-1.5">
          {data.perTenant.map((p) => (
            <li key={p.memberId} className="flex items-center justify-between text-sm">
              <span>{p.name}</span>
              <span className={cn("tabular-nums", p.paid >= p.target ? "text-acid" : "text-muted-foreground")}>
                ₹{inr(p.paid)} / ₹{inr(p.target)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {isTenant && !data.complete && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-sm font-medium">Record a rent payment</p>
          <div className="flex gap-2">
            <select value={who} onChange={(e) => setWho(e.target.value)} className="h-10 flex-1 rounded-xl border border-input bg-card px-3 text-sm">
              <option value="">Who paid?</option>
              {members.map((m) => (
                <option key={m.memberId} value={m.memberId}>{m.name}</option>
              ))}
            </select>
            <input
              type="number"
              inputMode="numeric"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              placeholder="₹"
              className="h-10 w-24 rounded-xl border border-input bg-card px-3 text-sm"
            />
            <button
              type="button"
              disabled={rec.isPending || !who || !(Number(amt) > 0)}
              onClick={() => {
                setMsg(null);
                rec.mutate(
                  { memberId: Number(who), amount: Math.round(Number(amt)), month },
                  { onSuccess: () => { setAmt(""); setWho(""); }, onError: (e) => setMsg(e instanceof ApiError ? e.message : "Couldn't record.") },
                );
              }}
              className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {msg && <p className="mt-2 text-sm text-destructive">{msg}</p>}
        </section>
      )}
    </div>
  );
}
