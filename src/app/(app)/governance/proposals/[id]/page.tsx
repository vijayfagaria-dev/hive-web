"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  PHASE_META,
  TYPE_META,
  categoryEmoji,
  useProposal,
  useRulebook,
  useSubmitProposal,
  useUpdateProposal,
  type ProposalDetail,
} from "@/lib/governance";
import { useGovMe } from "@/lib/gov-user";
import { ApiError } from "@/lib/api";
import { Avatar } from "@/components/app/avatar";
import { VoteCountdown } from "@/components/app/vote-countdown";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/governance/status-chip";
import { RuleDiff } from "@/components/governance/rule-diff";
import { VotePanel } from "@/components/governance/vote-panel";
import { AdminControls } from "@/components/governance/admin-controls";
import { ProposalTimeline } from "@/components/governance/proposal-timeline";
import { DiscussionThread } from "@/components/governance/discussion-thread";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">{children}</p>;
}

/** Client-only "proposed Xm ago" so we never call Date.now() during render. */
function ProposedAgo({ ts }: { ts: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- relative time is computed on mount to avoid Date.now() during render
    if (mins < 1) setLabel("just now");
    else if (mins < 60) setLabel(`${mins}m ago`);
    else if (mins < 1440) setLabel(`${Math.round(mins / 60)}h ago`);
    else setLabel(`${Math.round(mins / 1440)}d ago`);
  }, [ts]);
  return <span>{label ? `proposed ${label}` : "proposed"}</span>;
}

/** Collapsible draft editor — only the proposer sees it (canEdit). Sends expectedVersion
 *  so a stale edit surfaces a 409 we can explain. */
function DraftEditor({ proposal }: { proposal: ProposalDetail }) {
  const submit = useSubmitProposal(proposal.id);
  const update = useUpdateProposal(proposal.id);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(proposal.title);
  const [body, setBody] = useState(proposal.body ?? "");
  const [proposedText, setProposedText] = useState(proposal.proposedText ?? "");
  const [proposedCategory, setProposedCategory] = useState(proposal.proposedCategory ?? "");
  const [amountStr, setAmountStr] = useState(proposal.proposedAmount != null ? String(proposal.proposedAmount) : "");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const inputCls =
    "w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

  function save() {
    setErr(null);
    setSaved(false);
    const trimmedAmount = amountStr.trim();
    update.mutate(
      {
        title: title.trim(),
        body: body.trim() || null,
        proposedText: proposedText.trim() || null,
        proposedCategory: proposedCategory.trim() || null,
        proposedAmount: trimmedAmount === "" ? null : Number(trimmedAmount),
        expectedVersion: proposal.version,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (e) =>
          setErr(
            e instanceof ApiError && e.status === 409
              ? "This changed since you loaded — reload."
              : e instanceof ApiError
                ? e.message
                : "Couldn't save your edits.",
          ),
      },
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>You drafted this</Eyebrow>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:border-foreground"
          >
            {open ? "Close editor" : "✏️ Edit"}
          </button>
          <button
            type="button"
            disabled={submit.isPending}
            onClick={() => submit.mutate()}
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground glow-acid disabled:opacity-60"
          >
            {submit.isPending ? "Submitting…" : "📤 Submit for voting"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <label className="block space-y-1">
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">Rationale</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">Rule text</span>
            <textarea value={proposedText} onChange={(e) => setProposedText(e.target.value)} rows={2} className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">Category</span>
              <input value={proposedCategory} onChange={(e) => setProposedCategory(e.target.value)} className={inputCls} />
            </label>
            <label className="block space-y-1">
              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">Fine (₹)</span>
              <input
                type="number"
                min={0}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className={`${inputCls} tabular-nums`}
              />
            </label>
          </div>
          {err && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {err}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={update.isPending}
              onClick={save}
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
            >
              {update.isPending ? "Saving…" : "Save changes"}
            </button>
            {saved && <span className="text-xs text-lime-700">Saved ✓</span>}
          </div>
        </div>
      )}
    </section>
  );
}

function Loaded({ data, refetch }: { data: ProposalDetail; refetch: () => void }) {
  const me = useGovMe();
  const type = TYPE_META[data.type];

  // Current rule text for the diff: only modify/delete carry a target.
  const needsRulebook = data.type === "modify_rule" || data.type === "delete_rule";
  const rulebook = useRulebook();
  const currentRule =
    needsRulebook && data.targetRuleId != null
      ? rulebook.data?.rules.find((r) => r.id === data.targetRuleId)?.text ?? null
      : null;

  const v = data.vote;
  const turnout = v.yes + v.no + v.abstain;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      {/* 1. back */}
      <Link
        href="/governance/proposals"
        className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        ← All proposals
      </Link>

      {/* 2. header */}
      <header className="mt-4">
        <Eyebrow>
          {type.emoji} {type.label} · {categoryEmoji(data.proposedCategory)} {data.proposedCategory || ""}
        </Eyebrow>
        <h1 className="mt-2 text-pretty font-heading text-3xl font-bold tracking-tight">{data.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusChip phase={data.phase} />
          {data.frozen && (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-mono text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground ring-1 ring-border">
              ❄︎ Frozen
            </span>
          )}
          {data.phase === "voting" && data.votingClosesAt ? (
            <span className="font-mono text-xs text-muted-foreground">
              ⏳ Voting ends in <VoteCountdown deadline={data.votingClosesAt} onExpire={() => refetch()} />
            </span>
          ) : data.resolutionDetail ? (
            <span className="font-mono text-xs text-muted-foreground">{data.resolutionDetail}</span>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              {PHASE_META[data.phase].emoji} {PHASE_META[data.phase].label}
            </span>
          )}
        </div>
      </header>

      {/* author row */}
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Avatar name={data.proposer?.name ?? "?"} className="size-7 text-xs" />
        <span>
          <span className="font-medium text-foreground">{data.proposer?.name ?? "Someone"}</span> ·{" "}
          <ProposedAgo ts={data.createdAt} />
        </span>
      </div>

      {/* 3. vote panel */}
      <div className="mt-6">
        <VotePanel proposal={data} me={me} />
      </div>

      {/* 4. admin */}
      {data.canAdmin && (
        <div className="mt-4">
          <AdminControls proposal={data} />
        </div>
      )}

      {/* 5. draft editor (proposer only) */}
      {data.canEdit && (
        <div className="mt-4">
          <DraftEditor proposal={data} />
        </div>
      )}

      {/* 6. the case */}
      <section className="mt-6 glass rounded-2xl p-5">
        <Eyebrow>The case</Eyebrow>
        {data.body ? (
          <p className="mt-2 text-pretty text-sm leading-relaxed">{data.body}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No rationale given.</p>
        )}
      </section>

      {/* 7. proposed change */}
      <section className="mt-6">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-acid">
          {data.type === "delete_rule" ? "Removing this rule" : "Proposed change"}
        </h2>
        {data.type === "delete_rule" && currentRule ? (
          <div className="overflow-hidden rounded-xl border border-destructive/30 font-mono text-sm leading-relaxed">
            <div className="border-b border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[0.65rem] uppercase tracking-wider text-destructive">
              Rule to remove
            </div>
            <p className="bg-destructive/5 px-3 py-2.5 text-foreground line-through decoration-destructive/50">
              {currentRule}
            </p>
          </div>
        ) : (
          <RuleDiff current={currentRule} proposed={data.proposedText ?? ""} />
        )}
        {(data.proposedCategory || data.proposedAmount != null) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {data.proposedCategory && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium">
                {categoryEmoji(data.proposedCategory)} {data.proposedCategory}
              </span>
            )}
            {data.proposedAmount != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium tabular-nums">
                ₹{data.proposedAmount} fine
              </span>
            )}
          </div>
        )}
      </section>

      {/* 8. supporters / opponents summary */}
      <section className="mt-6 glass rounded-2xl p-4">
        <Eyebrow>Where the flat stands</Eyebrow>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-heading text-2xl font-bold tabular-nums text-lime-700">{v.yes}</p>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">Support</p>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold tabular-nums text-destructive">{v.no}</p>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">Oppose</p>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold tabular-nums text-muted-foreground">{v.abstain}</p>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">Abstain</p>
          </div>
        </div>
        <p className="mt-3 text-center font-mono text-[0.65rem] text-muted-foreground">
          {turnout} of {v.eligible} tenants voted
        </p>
        {v.myVote && (
          <p className="mt-2 text-center text-sm">
            <span className="rounded-full bg-primary/15 px-3 py-1 font-semibold text-lime-800 ring-1 ring-primary/30">
              You voted {v.myVote}
            </span>
          </p>
        )}
      </section>

      {/* 9. timeline */}
      <div className="mt-8">
        <ProposalTimeline events={data.timeline} createdAt={data.createdAt} votingClosesAt={data.votingClosesAt} />
      </div>

      {/* 10. discussion */}
      <div className="mt-8">
        <DiscussionThread proposalId={data.id} comments={data.comments} me={me} />
      </div>
    </main>
  );
}

export default function ProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const valid = Number.isFinite(id) && id > 0;
  const { data, isPending, isError, refetch } = useProposal(id);

  if (!valid) {
    return (
      <EmptyState
        emoji="🕳️"
        title="Proposal not found"
        note="That link doesn't point to a real proposal."
        action={
          <Link href="/governance/proposals" className="rounded-full border border-border px-4 py-2 text-sm">
            ← All proposals
          </Link>
        }
        className="min-h-[60svh]"
      />
    );
  }

  if (isPending) {
    return (
      <main className="mx-auto max-w-2xl space-y-5 px-5 py-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        emoji="🕳️"
        title="Proposal not found"
        note="It may have been withdrawn, or the link is off."
        action={
          <Link href="/governance/proposals" className="rounded-full border border-border px-4 py-2 text-sm">
            ← All proposals
          </Link>
        }
        className="min-h-[60svh]"
      />
    );
  }

  return <Loaded data={data} refetch={refetch} />;
}
