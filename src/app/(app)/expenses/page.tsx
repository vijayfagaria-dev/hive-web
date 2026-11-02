"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { ExpenseList } from "@/components/app/expense-list";
import { IPaidWizard } from "@/components/app/i-paid-wizard";
import { RecurringTab } from "@/components/app/recurring-tab";
import { RentProgress } from "@/components/app/rent-progress";
import { RoommateLedger } from "@/components/app/roommate-ledger";
import { Skeleton } from "@/components/ui/skeleton";
import { addMonths, monthLabel, thisMonth } from "@/lib/months";
import { cn } from "@/lib/utils";

const inr = (n: number) => n.toLocaleString("en-IN");

type Tab = "expenses" | "settle" | "rent" | "recurring";

export default function ExpensesPage() {
  const me = useAuth().data?.member ?? null;
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

      <button
        type="button"
        onClick={() => setWizard(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground glow-acid"
      >
        <Plus className="size-5" /> I paid for something
      </button>

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

      {tab === "expenses" && <ExpensesTab meId={me?.id ?? null} />}
      {tab === "settle" && <SettleTab meId={me?.id ?? null} />}
      {tab === "rent" && <RentTab members={members} />}
      {tab === "recurring" && <RecurringTab members={members} meId={me?.id ?? null} />}

      <IPaidWizard open={wizard} onClose={() => setWizard(false)} members={members} meId={me?.id ?? null} />
    </main>
  );
}

function ExpensesTab({ meId }: { meId: number | null }) {
  const { data, isPending } = useExpenses();
  const del = useDeleteExpense();
  if (isPending || !data) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (!data.expenses.length)
    return <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No expenses yet — tap the I-paid button above.</p>;
  return <ExpenseList expenses={data.expenses} meId={meId} onDelete={(id) => del.mutate(id)} />;
}

function SettleTab({ meId }: { meId: number | null }) {
  const { data, isPending } = useSettlePreview();
  const pay = useRecordPayment();
  if (isPending || !data) return <Skeleton className="h-40 w-full rounded-2xl" />;
  return (
    <div className="space-y-3">
      <section className="glass rounded-2xl p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Where everyone stands</p>
        <RoommateLedger rows={data.balances} meId={meId} />
      </section>
      {!data.transfers.length ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Everyone&apos;s square. Nothing to settle. 🎉</p>
      ) : (
      <p className="text-center text-sm text-muted-foreground">
        The fastest way to settle: <b className="text-foreground">{data.transfers.length} transfer{data.transfers.length > 1 ? "s" : ""}</b>.
      </p>
      )}
      <ul className="space-y-2">
        {data.transfers.map((t) => (
          // Keyed by the amount too: once a part payment lands the preview recomputes and
          // the row remounts, re-defaulting the input to what's actually left.
          <SettleRow key={`${t.fromId}-${t.toId}-${t.amount}`} t={t} meId={meId} pay={pay} />
        ))}
      </ul>
    </div>
  );
}

/** One proposed transfer. If it's yours to pay, the amount is editable so you can pay
 *  part of it now and the rest another day — the next preview shows what's still owed. */
function SettleRow({
  t,
  meId,
  pay,
}: {
  t: { fromId: number; fromName: string | null; toId: number; toName: string | null; amount: number };
  meId: number | null;
  pay: ReturnType<typeof useRecordPayment>;
}) {
  const iOwe = t.fromId === meId;
  const owedToMe = t.toId === meId;
  const [amt, setAmt] = useState(String(t.amount));
  const [msg, setMsg] = useState<string | null>(null);

  const value = Number(amt);
  const valid = Number.isInteger(value) && value > 0 && value <= t.amount;
  const left = valid ? t.amount - value : 0;

  return (
    <li className="rounded-2xl border border-border bg-card px-4 py-3">
      {/* wraps instead of overflowing once the controls no longer fit beside the label */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
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
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={t.amount}
                value={amt}
                onChange={(e) => { setAmt(e.target.value); setMsg(null); }}
                aria-label={`Amount to pay ${t.toName ?? "them"}`}
                className={cn(
                  "h-10 w-28 rounded-xl border border-input bg-card pl-7 pr-3 text-right text-sm tabular-nums outline-none",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
                  // the native spinners crowd a field this narrow
                  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  !valid && "border-destructive",
                )}
              />
            </div>
            <button
              type="button"
              disabled={pay.isPending || !valid}
              onClick={() =>
                pay.mutate(
                  { fromId: t.fromId, toId: t.toId, amount: value, note: "settle up" },
                  { onError: (e) => setMsg(e instanceof ApiError ? e.message : "Couldn't record that.") },
                )
              }
              className="h-10 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {valid && left > 0 ? "Pay part" : "Mark paid"}
            </button>
          </div>
        )}
      </div>
      {iOwe && (
        <p className={cn("mt-1.5 text-right text-xs", valid ? "text-muted-foreground" : "text-destructive")}>
          {!valid
            ? `Enter an amount between ₹1 and ₹${inr(t.amount)}.`
            : left > 0
              ? `₹${inr(left)} will still be owed after this.`
              : "Clears this transfer in full."}
        </p>
      )}
      {msg && <p className="mt-1 text-right text-xs text-destructive">{msg}</p>}
    </li>
  );
}

// Rent can go to this month (default), one month ahead, or any of the past year — so a
// short month can be paid off later and next month's rent paid early.
function RentTab({ members }: { members: { memberId: number; name: string }[] }) {
  const current = thisMonth();
  const options = Array.from({ length: 13 }, (_, i) => addMonths(current, 1 - i)); // next … 11 back
  const [month, setMonth] = useState(current);
  const { data, isPending } = useRentStatus(month);
  const prevMonth = addMonths(current, -1);
  const prev = useRentStatus(prevMonth).data;
  const rec = useRecordRent();
  const [who, setWho] = useState<string>("");
  const [amt, setAmt] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const pick = (m: string) => {
    setMonth(m);
    setAmt("");
    setMsg(null);
  };
  const tag = (m: string) => (m === current ? " · this month" : m > current ? " · next month" : "");

  if (data && !data.target)
    return <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Rent target isn&apos;t set up yet.</p>;

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">Month</span>
        <select
          value={month}
          onChange={(e) => pick(e.target.value)}
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm"
        >
          {options.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}{tag(m)}</option>
          ))}
        </select>
      </label>

      {/* Only nudge about a month that was started but not finished. */}
      {month !== prevMonth && prev && prev.collected > 0 && !prev.complete && (
        <button
          type="button"
          onClick={() => pick(prevMonth)}
          className="w-full rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-left text-sm"
        >
          {monthLabel(prevMonth)} still has <b className="tabular-nums">₹{inr(prev.remaining)}</b> to pay ·{" "}
          <span className="font-semibold underline">Pay it</span>
        </button>
      )}

      {isPending || !data ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <section className="glass rounded-2xl p-5">
          <RentProgress data={data} />
        </section>
      )}

      {data && !data.complete && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Record rent for {monthLabel(month)}</p>
            <button
              type="button"
              onClick={() => setAmt(String(data.remaining))}
              className="font-mono text-xs uppercase tracking-wider text-acid hover:underline"
            >
              Pay the rest · ₹{inr(data.remaining)}
            </button>
          </div>
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
