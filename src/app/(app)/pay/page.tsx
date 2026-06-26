"use client";

/* eslint-disable @next/next/no-img-element -- the wallet QR fallback is an external image URL. */
import { useState } from "react";
import QRCode from "react-qr-code";
import { ApiError, type UnpaidFine, type UpiBlock } from "@/lib/api";
import { usePay, usePayFine } from "@/lib/queries";
import { Sheet } from "@/components/app/sheet";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const inr = (n: number) => n.toLocaleString("en-IN");
type UpiReady = Extract<UpiBlock, { configured: true }>;

const APPS: { key: keyof UpiReady["links"]; label: string; emoji: string }[] = [
  { key: "gpay", label: "Google Pay", emoji: "🟢" },
  { key: "phonepe", label: "PhonePe", emoji: "🟣" },
  { key: "paytm", label: "Paytm", emoji: "🔵" },
  { key: "any", label: "Any UPI app", emoji: "📲" },
];

function PayButtons({ links }: { links: UpiReady["links"] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {APPS.map((a) => (
        <a
          key={a.key}
          href={links[a.key]}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold transition active:scale-95"
        >
          <span aria-hidden>{a.emoji}</span> {a.label}
        </a>
      ))}
    </div>
  );
}

function PotCard({ upi }: { upi: UpiReady }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(upi.payeeVpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the VPA is shown on the button anyway */
    }
  };
  return (
    <section className="glass rounded-2xl p-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Scan to pay the jar{upi.amount ? ` · ₹${inr(upi.amount)}` : ""}
      </p>
      <div className="mx-auto mt-4 w-fit rounded-xl border border-border bg-white p-3">
        <QRCode value={upi.links.any} size={196} />
      </div>
      <button
        type="button"
        onClick={copy}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium"
      >
        <span className="font-mono">{upi.payeeVpa}</span>
        <span className="text-xs text-muted-foreground">{copied ? "copied ✓" : "tap to copy"}</span>
      </button>
      <PayButtons links={upi.links} />
      <p className="mt-3 text-xs text-muted-foreground">
        Opens your UPI app with the amount filled in. Money goes straight to the jar — the app never touches it.
      </p>
    </section>
  );
}

export default function PayPage() {
  const { data, isPending } = usePay();
  const payFine = usePayFine();
  const [confirm, setConfirm] = useState<UnpaidFine | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-xl space-y-6 px-5 py-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Square up</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">💸 Pay into the pot</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pay the jar by scan or UPI app, then tap <b className="text-foreground">I paid</b> — that records a
          claim, reconciled against the jar. The app never moves money.
        </p>
      </header>

      {isPending || !data ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <>
          {data.upi.configured && data.total > 0 ? (
            <PotCard upi={data.upi} />
          ) : data.walletQr ? (
            <section className="glass rounded-2xl p-6 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Scan to pay the jar&apos;s UPI</p>
              <img
                src={data.walletQr}
                alt="Wallet UPI QR"
                className="mx-auto mt-4 size-56 rounded-xl border border-border bg-white object-contain p-2"
              />
            </section>
          ) : data.total > 0 ? (
            <section className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
              UPI isn&apos;t set up yet — pay the jar however the flat agreed, then mark it below.
            </section>
          ) : null}

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Your unpaid fines</h2>
              {data.total > 0 && <span className="font-semibold tabular-nums text-acid">₹{inr(data.total)} owed</span>}
            </div>
            {data.unpaid.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {data.unpaid.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {f.rule ?? "Fine"} — <b className="tabular-nums">₹{f.amount}</b>
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      {f.upi.configured && (
                        <a
                          href={f.upi.links.any}
                          className="rounded-full border border-border px-3 py-1.5 text-sm font-medium"
                        >
                          Pay
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setConfirm(f);
                        }}
                        className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground"
                      >
                        I paid
                      </button>
                    </div>
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
              Mark <b className="tabular-nums">₹{confirm.amount}</b> for “{confirm.rule ?? "this fine"}” paid into the
              jar? This just records a claim — it doesn&apos;t move any money.
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
