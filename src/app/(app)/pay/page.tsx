"use client";

import { usePay, usePayFine } from "@/lib/queries";
import { Reveal } from "@/components/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PayPage() {
  const { data, isPending } = usePay();
  const payFine = usePayFine();

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Square up</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">💸 Pay into the pot</h1>
        <p className="mt-3 text-muted-foreground">
          Marking paid records a claim, reconciled against the jar — the app never moves money.
        </p>
      </Reveal>

      <Reveal>
        <section className="glass mt-8 rounded-2xl p-6">
          {data?.walletQr ? (
            <div className="text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Scan to pay the jar&apos;s UPI
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.walletQr}
                alt="Wallet UPI QR"
                className="mx-auto mt-4 size-56 rounded-xl border border-white/15 bg-white p-2 object-contain"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No wallet QR is set up yet — pay the jar however the flat agreed, then mark it below.
            </p>
          )}

          <h2 className="mt-8 text-lg font-semibold">Your unpaid fines</h2>
          {isPending ? (
            <div className="mt-4 h-16 animate-pulse rounded-lg bg-white/5" />
          ) : data && data.unpaid.length > 0 ? (
            <ul className="mt-4 divide-y divide-white/8">
              {data.unpaid.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-4 py-3">
                  <span>
                    {f.rule ?? "Fine"} — <span className="font-semibold tabular-nums">₹{f.amount}</span>
                  </span>
                  <button
                    onClick={() => payFine.mutate(f.id)}
                    disabled={payFine.isPending}
                    className={cn(buttonVariants({ size: "sm" }), "rounded-full font-semibold")}
                  >
                    {payFine.isPending ? "…" : "Mark paid"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-muted-foreground">Nothing owed. 🎉</p>
          )}
        </section>
      </Reveal>
    </main>
  );
}
