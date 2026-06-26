"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  TYPE_META,
  categoryEmoji,
  yesPct,
  type GovUser,
  type ProposalSummary,
} from "@/lib/governance";
import { Avatar } from "@/components/app/avatar";
import { VoteCountdown } from "@/components/app/vote-countdown";
import { StatusChip } from "./status-chip";
import { VoteRing } from "./vote-ring";
import { VoteBar } from "./vote-bar";
import { cn } from "@/lib/utils";

function ringTone(phase: ProposalSummary["phase"]) {
  if (phase === "passed") return "passed" as const;
  if (phase === "rejected" || phase === "cancelled") return "rejected" as const;
  if (phase === "voting") return "live" as const;
  return "neutral" as const;
}

export function ProposalCard({
  proposal: p,
}: {
  proposal: ProposalSummary;
  me?: GovUser | null;
}) {
  const [open, setOpen] = useState(false);
  const type = TYPE_META[p.type];
  const proposerName = p.proposer?.name ?? "?";

  return (
    <article className="glass overflow-hidden rounded-2xl transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            <span>{type.emoji} {type.label}</span>
            {p.proposedCategory && (
              <span>· {categoryEmoji(p.proposedCategory)} {p.proposedCategory}</span>
            )}
          </div>
          <Link href={`/governance/proposals/${p.id}`} className="mt-0.5 block">
            <h3 className="text-pretty font-heading text-base font-semibold leading-snug tracking-tight hover:text-acid">
              {p.title}
            </h3>
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusChip phase={p.phase} />
            {p.frozen && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/15 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide text-sky-700 ring-1 ring-sky-500/30">
                ❄︎ frozen
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Avatar name={proposerName} className="size-4 text-[0.5rem]" /> {proposerName}
            </span>
            {p.phase === "voting" && p.votingClosesAt && (
              <span className="font-mono text-xs text-muted-foreground">
                ⏳ <VoteCountdown deadline={p.votingClosesAt} />
              </span>
            )}
          </div>
        </div>

        <VoteRing pct={yesPct(p.tally)} tone={ringTone(p.phase)} size={56} stroke={6} />

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Collapse" : "Expand"}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {/* expandable body */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-border px-4 py-4">
            <VoteBar yes={p.tally.yes} no={p.tally.no} abstain={p.tally.abstain} />

            {p.proposedText && (
              <p className="rounded-xl bg-muted/60 px-3 py-2 font-mono text-sm leading-relaxed text-foreground">
                {p.proposedText}
              </p>
            )}

            {p.resolutionDetail && (
              <p className="text-pretty text-sm text-muted-foreground">{p.resolutionDetail}</p>
            )}

            <Link
              href={`/governance/proposals/${p.id}`}
              className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-acid hover:underline"
            >
              Open full discussion →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
