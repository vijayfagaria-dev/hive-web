"use client";

/* eslint-disable @next/next/no-img-element -- the wallet QR is an external image URL. */
import { useState } from "react";
import { ApiError, type UnpaidFine } from "@/lib/api";
import { usePay, usePayFine } from "@/lib/queries";
import { Sheet } from "@/components/app/sheet";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const inr = (n: number) => n.toLocaleString("en-IN");

export default function PayPage() {
  const { data, isPending } = usePay();
  const payFine = usePayFine();
  const [confirm, setConfirm] = useState<UnpaidFine | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = data?.unpaid.reduce((s, f) => s + f.amount, 0) ?? 0;

  return (
    <main className="mx-auto max-w-xl space-y-6 px-5 py-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Square up</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">💸 Pay into the pot</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Marking paid records a <b className="text-foreground">claim</b>, reconciled against the jar — the app never moves money.
        </p>
      </header>

      {isPending ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <>
          {data?.walletQr ? (
            <section className="glass rounded-2xl p-6 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Scan to pay the jar&apos;s UPI</p>
              <img
                src={data.walletQr}
                alt="Wallet UPI QR"
                className="mx-auto mt-4 size-56 rounded-xl border border-border bg-white object-contain p-2"
              />
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
              No wallet QR is set up yet — pay the jar however the flat agreed, then mark it below.
            </section>
          )}

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Your unpaid fines</h2>
              {total > 0 && <span className="font-semibold tabular-nums text-acid">₹{inr(total)} owed</span>}
            </div>
            {data && data.unpaid.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {data.unpaid.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {f.rule ?? "Fine"} — <b className="tabular-nums">₹{f.amount}</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setConfirm(f);
                      }}
                      className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground"
                    >
                      I paid
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3">
                <EmptyState emoji="🎉" title="Nothing owed" note="You're all square with the jar." />
              </div>
            )}
          </section>
        </>
      )}

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title="Mark paid?">
        {confirm && (
          <>
            <p className="text-sm">
              Mark <b className="tabular-nums">₹{confirm.amount}</b> for “{confirm.rule ?? "this fine"}” paid into the jar?
              This just records a claim — it doesn&apos;t move any money.
            </p>
            {error && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setConfirm(null)} className="rounded-xl border border-border py-3 text-sm font-medium">
                Cancel
              </button>
              <button
                type="button"
                disabled={payFine.isPending}
                onClick={() =>
                  payFine.mutate(confirm.id, {
                    onSuccess: () => setConfirm(null),
                    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't mark that paid."),
                  })
                }
                className="rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {payFine.isPending ? "…" : "Yes, mark paid"}
              </button>
            </div>
          </>
        )}
      </Sheet>
    </main>
  );
}
