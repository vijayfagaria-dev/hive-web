"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  CATEGORY_PRESETS,
  TYPE_META,
  categoryEmoji,
  useCreateProposal,
  useRulebook,
  type ProposalType,
  type RuleBookRule,
} from "@/lib/governance";
import { useGovMe } from "@/lib/gov-user";
import { ApiError } from "@/lib/api";
import { RuleDiff } from "./rule-diff";
import { EmptyState } from "@/components/app/empty-state";
import { ConfettiBurst } from "@/components/app/confetti-burst";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── limits (mirror the server: title 3..140, body min 10, proposedText max 500) ──
const TITLE_MIN = 3;
const TITLE_MAX = 140;
const BODY_MIN = 10;
const TEXT_MAX = 500;

const FIELD_CLASS =
  "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

/** One-liners for the type cards. */
const TYPE_BLURB: Record<ProposalType, string> = {
  new_rule: "Add a brand-new rule to the book.",
  modify_rule: "Reword or re-price a rule that already exists.",
  delete_rule: "Retire a rule the flat no longer wants.",
};

/** Logical wizard steps. Some are skipped depending on the chosen type. */
type StepId = "type" | "target" | "title" | "rationale" | "details" | "preview" | "submit";

const STEP_META: Record<StepId, { emoji: string; title: string; helper: string }> = {
  type: { emoji: "🧭", title: "What kind of change?", helper: "Pick how this proposal touches the Rule Book." },
  target: { emoji: "📚", title: "Which rule?", helper: "Find the rule you want to change." },
  title: { emoji: "🏷️", title: "Give it a clear title", helper: "One line your flatmates see on the ballot." },
  rationale: { emoji: "💬", title: "Why are you proposing this?", helper: "The reasoning — what's the friction this fixes?" },
  details: { emoji: "📝", title: "Word the rule", helper: "The exact text, plus its category and fine." },
  preview: { emoji: "👀", title: "Here's the preview", helper: "This is how the change will read." },
  submit: { emoji: "🚀", title: "Ready to open this to a vote?", helper: "A 3-day window opens — tenants decide." },
};

/** Everything the wizard collects, in one object. */
type WizardState = {
  type: ProposalType | null;
  targetRuleId: number | null;
  title: string;
  body: string;
  proposedText: string;
  proposedCategory: string;
  proposedAmount: string; // kept as a raw string for the input; coerced on submit
};

const INITIAL: WizardState = {
  type: null,
  targetRuleId: null,
  title: "",
  body: "",
  proposedText: "",
  proposedCategory: "",
  proposedAmount: "",
};

export function ProposalWizard() {
  const me = useGovMe();
  const router = useRouter();
  const reduce = useReducedMotion();
  const rulebook = useRulebook();
  const create = useCreateProposal();

  const [form, setForm] = useState<WizardState>(INITIAL);
  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState(1); // 1 = forward, -1 = back
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = useCallback(
    <K extends keyof WizardState>(key: K, value: WizardState[K]) => setForm((f) => ({ ...f, [key]: value })),
    [],
  );

  // ── the step sequence depends on the chosen type ──
  const steps = useMemo<StepId[]>(() => {
    const t = form.type;
    if (t === "delete_rule") return ["type", "target", "title", "rationale", "preview", "submit"];
    if (t === "modify_rule") return ["type", "target", "title", "rationale", "details", "preview", "submit"];
    // new_rule (or not-yet-chosen — only the type step is reachable until chosen)
    return ["type", "title", "rationale", "details", "preview", "submit"];
  }, [form.type]);

  const total = steps.length;
  const stepId: StepId = steps[Math.min(stepIdx, total - 1)] ?? "type";

  // ── the rule a modify/delete proposal targets ──
  const targetRule = useMemo<RuleBookRule | null>(() => {
    if (form.targetRuleId == null) return null;
    return rulebook.data?.rules.find((r) => r.id === form.targetRuleId) ?? null;
  }, [form.targetRuleId, rulebook.data]);

  // ── derived field state ──
  const titleTrim = form.title.trim();
  const bodyTrim = form.body.trim();
  const textTrim = form.proposedText.trim();
  const amountNum = form.proposedAmount.trim() === "" ? null : Number(form.proposedAmount);
  const amountValid = amountNum === null || (Number.isInteger(amountNum) && amountNum >= 0);

  // ── per-step validity (disable Next until valid) ──
  const valid = useMemo(() => {
    switch (stepId) {
      case "type":
        return form.type != null;
      case "target":
        return form.targetRuleId != null;
      case "title":
        return titleTrim.length >= TITLE_MIN && form.title.length <= TITLE_MAX;
      case "rationale":
        return bodyTrim.length >= BODY_MIN;
      case "details":
        // proposedText required for new/modify; category free; amount optional-but-valid
        return textTrim.length > 0 && textTrim.length <= TEXT_MAX && amountValid;
      case "preview":
        return true;
      case "submit":
        return true;
      default:
        return false;
    }
  }, [stepId, form.type, form.targetRuleId, form.title, titleTrim, bodyTrim, textTrim, amountValid]);

  const goNext = useCallback(() => {
    if (!valid) return;
    setDir(1);
    setStepIdx((s) => Math.min(total - 1, s + 1));
  }, [valid, total]);

  const goBack = useCallback(() => {
    setDir(-1);
    setSubmitError(null);
    setStepIdx((s) => Math.max(0, s - 1));
  }, []);

  // Picking a type can change the sequence; reset position so we don't land on a now-invalid step.
  const pickType = useCallback((t: ProposalType) => {
    setForm((f) => ({
      ...f,
      type: t,
      // a fresh type means a fresh target choice
      targetRuleId: t === "new_rule" ? null : f.targetRuleId,
    }));
  }, []);

  // Choosing a rule for modify prefills the editable text from the current rule.
  const pickRule = useCallback(
    (rule: RuleBookRule) => {
      setForm((f) => ({
        ...f,
        targetRuleId: rule.id,
        proposedText: f.type === "modify_rule" && !f.proposedText.trim() ? rule.text : f.proposedText,
        proposedCategory: f.proposedCategory.trim() ? f.proposedCategory : rule.category,
        proposedAmount: f.proposedAmount.trim() ? f.proposedAmount : String(rule.amount),
      }));
    },
    [],
  );

  const submit = useCallback(() => {
    if (create.isPending || done || !form.type) return;
    setSubmitError(null);

    const type = form.type;
    const body: Parameters<typeof create.mutate>[0] = {
      type,
      title: titleTrim,
      body: bodyTrim,
      submit: true,
    };
    if (type !== "new_rule") body.targetRuleId = form.targetRuleId;
    if (type !== "delete_rule") {
      body.proposedText = textTrim;
      const cat = form.proposedCategory.trim();
      if (cat) body.proposedCategory = cat;
      if (amountNum !== null) body.proposedAmount = amountNum;
    }

    create.mutate(body, {
      onSuccess: ({ proposalId }) => {
        setDone(true);
        window.setTimeout(() => router.push(`/governance/proposals/${proposalId}`), 1400);
      },
      onError: (e) =>
        setSubmitError(e instanceof ApiError ? e.message : "Couldn't open the vote. Try again."),
    });
  }, [create, done, form.type, form.targetRuleId, form.proposedCategory, titleTrim, bodyTrim, textTrim, amountNum, router]);

  // Enter advances on a valid step (not inside a textarea, not on the submit step).
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA") return;
      if (stepId === "submit") return;
      if (!valid) return;
      e.preventDefault();
      goNext();
    },
    [stepId, valid, goNext],
  );

  // ── sign-in gate ──
  if (!me) {
    return (
      <EmptyState
        emoji="🔑"
        title="Sign in to propose a rule"
        note="Proposals go to a flat-wide vote, so we need to know who's putting it forward."
        action={
          <Link
            href="/login"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-acid"
          >
            Sign in
          </Link>
        }
        className="min-h-[60svh]"
      />
    );
  }

  const meta = STEP_META[stepId];
  const offset = reduce ? 0 : dir * 28;

  return (
    <div onKeyDown={onKeyDown}>
      <ConfettiBurst fire={done} />

      {/* header / progress */}
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">🏛️ New Proposal</p>
        <div className="mt-3 flex items-center gap-2" aria-hidden>
          {steps.map((id, i) => (
            <span key={id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.span
                className="block h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: i <= stepIdx ? "100%" : "0%" }}
                transition={reduce ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
              />
            </span>
          ))}
        </div>
        <p
          className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          Step {Math.min(stepIdx + 1, total)} of {total}
        </p>
      </header>

      {/* animated step body */}
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={stepId}
            initial={{ opacity: 0, x: offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -offset }}
            transition={reduce ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
          >
            <div className="text-center">
              <div className="text-5xl" aria-hidden>
                {done ? "🎉" : meta.emoji}
              </div>
              <h1 className="mt-3 text-balance font-heading text-2xl font-bold tracking-tight">
                {done ? "Proposal is live!" : meta.title}
              </h1>
              <p className="mt-1 text-pretty text-sm text-muted-foreground">
                {done ? "Taking you to the discussion…" : meta.helper}
              </p>
            </div>

            {!done && (
              <div className="mt-6">
                <StepFields
                  stepId={stepId}
                  form={form}
                  set={set}
                  rulebook={rulebook}
                  targetRule={targetRule}
                  amountValid={amountValid}
                  pickType={pickType}
                  pickRule={pickRule}
                  submit={submit}
                  submitting={create.isPending}
                  submitError={submitError}
                />
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {/* nav */}
      {!done && (
        <div className="mt-8 flex items-center gap-3">
          {stepIdx > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden /> Back
            </button>
          )}
          {stepId !== "submit" && (
            <button
              type="button"
              onClick={goNext}
              disabled={!valid}
              className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition disabled:opacity-40"
            >
              Next <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type RulebookQuery = ReturnType<typeof useRulebook>;

function StepFields({
  stepId,
  form,
  set,
  rulebook,
  targetRule,
  amountValid,
  pickType,
  pickRule,
  submit,
  submitting,
  submitError,
}: {
  stepId: StepId;
  form: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  rulebook: RulebookQuery;
  targetRule: RuleBookRule | null;
  amountValid: boolean;
  pickType: (t: ProposalType) => void;
  pickRule: (rule: RuleBookRule) => void;
  submit: () => void;
  submitting: boolean;
  submitError: string | null;
}) {
  switch (stepId) {
    // ── 1. Type ──
    case "type":
      return (
        <fieldset>
          <legend className="sr-only">Proposal type</legend>
          <div className="grid gap-2.5">
            {(Object.keys(TYPE_META) as ProposalType[]).map((t) => {
              const m = TYPE_META[t];
              const active = form.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pickType(t)}
                  className={cn(
                    "flex items-center gap-3.5 rounded-2xl border p-4 text-left transition active:scale-[0.99]",
                    active
                      ? "border-acid bg-primary/10 ring-1 ring-primary/40"
                      : "border-border hover:border-acid hover:bg-muted/50",
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {m.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{TYPE_BLURB[t]}</span>
                  </span>
                  {active && <Check className="ml-auto size-5 text-acid" aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>
      );

    // ── 2. Target rule (modify / delete only) ──
    case "target":
      return (
        <TargetRulePicker form={form} rulebook={rulebook} pickRule={pickRule} />
      );

    // ── 3. Title ──
    case "title": {
      const len = form.title.length;
      const over = len > TITLE_MAX;
      const short = form.title.trim().length > 0 && form.title.trim().length < TITLE_MIN;
      return (
        <div>
          <label htmlFor="prop-title" className="sr-only">
            Title
          </label>
          <input
            id="prop-title"
            autoFocus
            value={form.title}
            maxLength={TITLE_MAX + 20}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Dishes done within 2 hours, not 'eventually'"
            aria-invalid={over || short}
            className={cn(FIELD_CLASS, (over || short) && "border-destructive focus-visible:border-destructive")}
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={cn(short ? "text-destructive" : "text-muted-foreground")}>
              {short ? `At least ${TITLE_MIN} characters.` : "A clear, specific headline works best."}
            </span>
            <span className={cn("font-mono tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>
              {len}/{TITLE_MAX}
            </span>
          </div>
        </div>
      );
    }

    // ── 4. Rationale (body) ──
    case "rationale": {
      const len = form.body.trim().length;
      const tooShort = len > 0 && len < BODY_MIN;
      return (
        <div>
          <label htmlFor="prop-body" className="sr-only">
            Rationale
          </label>
          <textarea
            id="prop-body"
            autoFocus
            rows={5}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder="What keeps going wrong, and why is this change the fix?"
            aria-invalid={tooShort}
            className={cn(FIELD_CLASS, tooShort && "border-destructive focus-visible:border-destructive")}
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={cn(tooShort ? "text-destructive" : "text-muted-foreground")}>
              {tooShort ? `At least ${BODY_MIN} characters.` : "Make the case so people get why it matters."}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">{len}/{BODY_MIN}+</span>
          </div>
        </div>
      );
    }

    // ── 5. Rule text + details (new / modify only) ──
    case "details": {
      const len = form.proposedText.length;
      const over = len > TEXT_MAX;
      const empty = form.proposedText.trim().length === 0;
      const amountRaw = form.proposedAmount.trim();
      return (
        <div className="space-y-5">
          <div>
            <label
              htmlFor="prop-text"
              className="mb-2 block font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground"
            >
              Rule text
            </label>
            <textarea
              id="prop-text"
              autoFocus
              rows={4}
              value={form.proposedText}
              maxLength={TEXT_MAX + 40}
              onChange={(e) => set("proposedText", e.target.value)}
              placeholder="Wash your own dishes within 2 hours of eating. Overnight dishes = a fine."
              aria-invalid={over}
              className={cn(FIELD_CLASS, "font-mono", over && "border-destructive focus-visible:border-destructive")}
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={cn(empty ? "text-muted-foreground" : over ? "text-destructive" : "text-muted-foreground")}>
                {form.type === "modify_rule"
                  ? "Edit the wording the flat would vote into the book."
                  : "Write it exactly as it should appear in the Rule Book."}
              </span>
              <span className={cn("font-mono tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>
                {len}/{TEXT_MAX}
              </span>
            </div>
          </div>

          {/* category */}
          <div>
            <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PRESETS.map((c) => {
                const active = form.proposedCategory.trim().toLowerCase() === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set("proposedCategory", c.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95",
                      active
                        ? "border-acid bg-primary/10 text-foreground ring-1 ring-primary/40"
                        : "border-border text-muted-foreground hover:border-acid hover:text-foreground",
                    )}
                  >
                    <span aria-hidden>{c.emoji}</span> {c.label}
                  </button>
                );
              })}
            </div>
            <label htmlFor="prop-cat" className="sr-only">
              Category (free text)
            </label>
            <input
              id="prop-cat"
              value={form.proposedCategory}
              onChange={(e) => set("proposedCategory", e.target.value)}
              placeholder="…or type your own"
              className={cn(FIELD_CLASS, "mt-2.5")}
            />
          </div>

          {/* amount */}
          <div>
            <label
              htmlFor="prop-amount"
              className="mb-2 block font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground"
            >
              Fine (optional)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₹
              </span>
              <input
                id="prop-amount"
                inputMode="numeric"
                value={form.proposedAmount}
                onChange={(e) => set("proposedAmount", e.target.value)}
                placeholder="0"
                aria-invalid={!amountValid}
                className={cn(
                  FIELD_CLASS,
                  "pl-8 tabular-nums",
                  !amountValid && "border-destructive focus-visible:border-destructive",
                )}
              />
            </div>
            {amountRaw !== "" && !amountValid && (
              <p className="mt-2 text-xs text-destructive">Enter a whole number of rupees (0 or more).</p>
            )}
          </div>
        </div>
      );
    }

    // ── 6. Preview ──
    case "preview": {
      const isModify = form.type === "modify_rule";
      const isDelete = form.type === "delete_rule";
      const current = isModify || isDelete ? (targetRule?.text ?? null) : null;
      const proposed = isDelete ? "" : form.proposedText.trim();
      const catLabel = isDelete ? targetRule?.category ?? null : form.proposedCategory.trim() || null;
      const amount = isDelete
        ? targetRule?.amount ?? null
        : form.proposedAmount.trim() === ""
          ? null
          : Number(form.proposedAmount);
      const typeMeta = form.type ? TYPE_META[form.type] : null;

      return (
        <div className="space-y-5">
          {isDelete && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              🗑️ This proposal would remove the rule below from the book.
            </div>
          )}

          <RuleDiff current={current} proposed={proposed} />

          <div className="glass space-y-3 rounded-2xl p-5">
            <p className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {typeMeta && (
                <span>
                  {typeMeta.emoji} {typeMeta.label}
                </span>
              )}
              {catLabel && (
                <span>
                  · {categoryEmoji(catLabel)} {catLabel}
                </span>
              )}
              {amount != null && <span className="tabular-nums">· ₹{amount}</span>}
            </p>
            <h2 className="text-pretty font-heading text-lg font-semibold leading-snug tracking-tight">
              {form.title.trim() || "Untitled proposal"}
            </h2>
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-acid">💬 Rationale</p>
              <p className="mt-0.5 text-pretty text-sm text-muted-foreground">{form.body.trim() || "—"}</p>
            </div>
          </div>
        </div>
      );
    }

    // ── 7. Submit ──
    case "submit":
      return (
        <div className="space-y-5">
          <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
            <p className="text-pretty">
              Opening the vote puts{" "}
              <span className="font-mono font-semibold text-foreground">“{form.title.trim()}”</span> on the flat ballot.
            </p>
            <ul className="mt-3 space-y-1.5">
              <li className="flex items-start gap-2">
                <span aria-hidden>⏳</span> It opens a roughly{" "}
                <span className="font-semibold text-foreground">72-hour (3-day)</span> voting window.
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>🗳️</span> <span className="font-semibold text-foreground">Tenants</span> decide —
                it passes at about <span className="font-semibold text-foreground">60% support</span> with quorum.
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>📖</span> If it passes, it merges into the Rule Book automatically.
              </li>
            </ul>
          </div>

          {submitError && (
            <p
              role="alert"
              className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {submitError} — go Back to tweak it and try again.
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground glow-acid transition active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Check className="size-5" aria-hidden /> Opening…
              </>
            ) : (
              <>🚀 Open the vote</>
            )}
          </button>
        </div>
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function TargetRulePicker({
  form,
  rulebook,
  pickRule,
}: {
  form: WizardState;
  rulebook: RulebookQuery;
  pickRule: (rule: RuleBookRule) => void;
}) {
  const [q, setQ] = useState("");

  if (rulebook.isPending) {
    return (
      <div className="space-y-2.5">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (rulebook.isError) {
    return (
      <EmptyState
        emoji="😵"
        title="Couldn't load the Rule Book"
        note="Check your connection and try again."
        action={
          <button
            type="button"
            onClick={() => rulebook.refetch()}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium"
          >
            Retry
          </button>
        }
      />
    );
  }

  const all = rulebook.data?.rules ?? [];
  const active = all.filter((r) => r.isActive);

  if (active.length === 0) {
    return (
      <EmptyState
        emoji="📭"
        title="No rules to change yet"
        note="The Rule Book is empty — propose a brand-new rule instead."
      />
    );
  }

  const needle = q.trim().toLowerCase();
  const matches = needle
    ? active.filter(
        (r) => r.text.toLowerCase().includes(needle) || r.category.toLowerCase().includes(needle),
      )
    : active;

  return (
    <div>
      <label htmlFor="rule-search" className="sr-only">
        Search rules
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id="rule-search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by text or category…"
          className={cn(FIELD_CLASS, "pl-10")}
        />
      </div>

      <ul className="mt-3 space-y-2" role="listbox" aria-label="Rules">
        {matches.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No rules match “{q.trim()}”.
          </li>
        ) : (
          matches.map((rule) => {
            const selected = form.targetRuleId === rule.id;
            return (
              <li key={rule.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => pickRule(rule)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition active:scale-[0.99]",
                    selected
                      ? "border-acid bg-primary/10 ring-1 ring-primary/40"
                      : "border-border hover:border-acid hover:bg-muted/50",
                  )}
                >
                  <span className="mt-0.5 text-xl" aria-hidden>
                    {categoryEmoji(rule.category)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        {rule.category}
                      </span>
                      <span className="font-mono text-[0.65rem] tabular-nums text-acid">₹{rule.amount}</span>
                    </span>
                    <span className="mt-0.5 block text-pretty text-sm">{rule.text}</span>
                  </span>
                  {selected && <Check className="mt-0.5 size-5 shrink-0 text-acid" aria-hidden />}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
