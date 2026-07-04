"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  useCreateExpense,
  useCreateRecurring,
  useCreateTemplate,
  useRecurring,
  useTemplates,
} from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const inr = (n: number) => n.toLocaleString("en-IN");
const CATS = ["internet", "electricity", "water", "gas", "house_help", "cleaner", "groceries", "brokerage", "misc"];
const CAT_EMOJI: Record<string, string> = {
  internet: "📶", electricity: "⚡", water: "🚰", gas: "🔥", house_help: "🧹",
  cleaner: "🧽", groceries: "🛒", brokerage: "🧑‍💼", misc: "🧾",
};

type Member = { memberId: number; name: string };

export function RecurringTab({ members, meId, isTenant }: { members: Member[]; meId: number | null; isTenant: boolean }) {
  const templates = useTemplates();
  const recurring = useRecurring();
  const createTpl = useCreateTemplate();
  const createRec = useCreateRecurring();
  const createExp = useCreateExpense();

  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("internet");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function generate(id: number) {
    setMsg(null);
    try {
      const pf = await api.templatePrefill(id);
      await createExp.mutateAsync({
        payerId: pf.payerId ?? meId ?? 0, amount: pf.amount, category: pf.category,
        strategy: pf.strategy, params: pf.params, participantIds: pf.participantIds, incurredOn: pf.incurredOn,
      });
      setMsg("Added this month's expense ✅");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Couldn't generate.");
    }
  }

  function saveTemplate() {
    const amt = Math.round(Number(amount) || 0);
    if (!name.trim() || !(amt > 0)) return;
    createTpl.mutate(
      {
        name: name.trim(), category, amount: amt, defaultPayerId: meId,
        strategy: "equal", params: null, participantIds: members.map((m) => m.memberId),
      },
      {
        onSuccess: () => { setName(""); setAmount(""); setShowNew(false); setMsg("Template saved ✅"); },
        onError: (e) => setMsg(e instanceof ApiError ? e.message : "Couldn't save."),
      },
    );
  }

  if (templates.isPending || recurring.isPending) return <Skeleton className="h-40 w-full rounded-2xl" />;

  return (
    <div className="space-y-4">
      {msg && <p className="text-center text-sm text-muted-foreground">{msg}</p>}

      {/* templates */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Templates</h2>
          {isTenant && (
            <button type="button" onClick={() => setShowNew((v) => !v)} className="font-mono text-xs uppercase tracking-wider text-acid">
              {showNew ? "Cancel" : "+ New"}
            </button>
          )}
        </div>

        {showNew && (
          <div className="mt-2 space-y-2 rounded-2xl border border-border bg-card p-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Wifi)" className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm" />
            <div className="flex gap-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 flex-1 rounded-xl border border-input bg-card px-3 text-sm">
                {CATS.map((c) => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
              </select>
              <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹" className="h-10 w-24 rounded-xl border border-input bg-card px-3 text-sm" />
            </div>
            <p className="text-xs text-muted-foreground">Splits equally across everyone; you&apos;re the default payer. Editable when generated.</p>
            <button type="button" onClick={saveTemplate} disabled={createTpl.isPending} className="h-10 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">
              Save template
            </button>
          </div>
        )}

        {templates.data && templates.data.templates.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {templates.data.templates.map((t) => {
              const isRecurring = recurring.data?.recurring.some((r) => r.templateId === t.id && r.status === "active");
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                  <span className="text-sm">
                    {CAT_EMOJI[t.category] ?? "🧾"} <b>{t.name}</b> · ₹{inr(t.amount)}
                    {isRecurring && <span className="ml-1 text-xs text-acid">· monthly</span>}
                  </span>
                  {isTenant && (
                    <span className="flex shrink-0 gap-2">
                      {!isRecurring && (
                        <button type="button" onClick={() => createRec.mutate({ templateId: t.id, dayOfMonth: 1 })} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">
                          Make monthly
                        </button>
                      )}
                      <button type="button" onClick={() => generate(t.id)} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                        <RefreshCw className="size-3" /> Add now
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            No templates yet. Create one for bills you add every month.
          </p>
        )}
      </section>

      {/* active recurring */}
      {recurring.data && recurring.data.recurring.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">Auto-generated monthly</h2>
          <ul className="mt-2 space-y-2">
            {recurring.data.recurring.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                <span>{CAT_EMOJI[r.category] ?? "🧾"} {r.templateName} · ₹{inr(r.amount)} · on the {r.dayOfMonth}</span>
                <span className={cn("text-xs", r.status === "active" ? "text-acid" : "text-muted-foreground")}>{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
