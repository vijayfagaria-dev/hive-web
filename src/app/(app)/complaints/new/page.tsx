"use client";

/* eslint-disable @next/next/no-img-element -- local object URLs for photo previews. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, X } from "lucide-react";
import { ApiError, type Rule } from "@/lib/api";
import { useCreateComplaint, useMe } from "@/lib/queries";
import { MemberPicker } from "@/components/app/member-picker";
import { RulesMenu } from "@/components/app/rules-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function NewComplaintPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { data, isPending } = useMe();
  const create = useCreateComplaint();

  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [accusedId, setAccusedId] = useState<number | null>(null);
  const [mode, setMode] = useState<"rule" | "amount">("rule");
  const [rule, setRule] = useState<Rule | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // preselected rule from /rules
  const preRuleId = params.get("ruleId");
  const others = useMemo(
    () => (data ? data.members.filter((m) => m.id !== data.member.id) : []),
    [data],
  );
  useEffect(() => {
    if (!preRuleId || !data || rule) return;
    const all = Object.values(data.rulesByCategory).flat();
    const found = all.find((r) => String(r.id) === preRuleId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from async-loaded rules
    if (found) setRule(found);
  }, [preRuleId, data, rule]);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object-URL previews need an effect for cleanup
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  if (isPending || !data) {
    return (
      <main className="mx-auto max-w-xl space-y-4 px-5 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </main>
    );
  }

  const hasReason = mode === "rule" ? !!rule : Number(amount) > 0;
  const canSubmit = photos.length > 0 && accusedId != null && hasReason && !create.isPending;

  function addPhotos(list: FileList | null) {
    if (!list) return;
    setPhotos((prev) => [...prev, ...Array.from(list)].slice(0, 6));
  }
  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    if (!canSubmit || accusedId == null) return;
    setError(null);
    create.mutate(
      {
        accusedId,
        images: photos,
        ...(mode === "rule" && rule ? { ruleId: rule.id } : { amount: Number(amount) }),
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      {
        onSuccess: (res) => router.replace(`/complaints/${res.complaintId}`),
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : "Couldn't file that — try again."),
      },
    );
  }

  return (
    <main className="mx-auto max-w-xl space-y-5 px-5 py-8">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">🚨 Report a complaint</h1>
        <p className="mt-1 text-sm text-muted-foreground">A complaint is a claim, not a verdict — snap proof, then who & why.</p>
      </header>

      <Step n={1} title="Photo proof">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => addPhotos(e.target.files)}
        />
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
              <img src={src} alt={`Proof ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                aria-label="Remove"
                onClick={() => removePhoto(i)}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {photos.length < 6 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-acid hover:text-acid"
            >
              <Camera className="size-6" />
            </button>
          )}
        </div>
        {photos.length === 0 && <p className="mt-2 text-xs text-muted-foreground">At least one photo is required.</p>}
      </Step>

      <Step n={2} title="Who did it?">
        <MemberPicker members={others} value={accusedId} onChange={setAccusedId} />
      </Step>

      <Step n={3} title="What did they do?">
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-full bg-muted p-1">
          {(["rule", "amount"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full py-1.5 text-sm font-medium transition-colors",
                mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {m === "rule" ? "House rule" : "Custom amount"}
            </button>
          ))}
        </div>

        {mode === "rule" ? (
          rule ? (
            <div className="flex items-center justify-between rounded-xl border border-acid bg-primary/10 px-4 py-3">
              <span className="text-sm font-medium">{rule.text}</span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-sm tabular-nums">₹{rule.amount}</span>
                <button type="button" className="text-xs text-acid underline" onClick={() => setRule(null)}>
                  change
                </button>
              </span>
            </div>
          ) : (
            <RulesMenu rulesByCategory={data.rulesByCategory} searchable onPick={setRule} />
          )
        ) : (
          <div>
            <label className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Fine amount (₹)</label>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50"
              className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What happened? (optional)"
              rows={2}
              className="mt-3 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </div>
        )}
      </Step>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="sticky bottom-24 h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground glow-acid transition disabled:opacity-50"
      >
        {create.isPending ? "Filing…" : "File the complaint"}
      </button>
    </main>
  );
}
