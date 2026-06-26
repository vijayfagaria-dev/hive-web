"use client";

import { useEffect, useState } from "react";
import { EVENT_META, type ProposalEvent } from "@/lib/governance";

/** Client-only relative time so we never call Date.now()/new Date() during render. */
function RelTime({ ts }: { ts: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- relative time is computed on mount to avoid Date.now() during render
    if (mins < 1) setLabel("just now");
    else if (mins < 60) setLabel(`${mins}m ago`);
    else if (mins < 1440) setLabel(`${Math.round(mins / 60)}h ago`);
    else setLabel(`${Math.round(mins / 1440)}d ago`);
  }, [ts]);
  return (
    <time dateTime={ts} className="font-mono text-[0.65rem] tabular-nums text-muted-foreground">
      {label || " "}
    </time>
  );
}

/** Client-only absolute date/time for the future deadline marker. */
function CloseLabel({ ts }: { ts: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- formatted on mount to avoid new Date() during render
    setLabel(
      new Date(ts).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    );
  }, [ts]);
  return <span className="font-mono text-[0.65rem] tabular-nums">{label || ts}</span>;
}

/** Vertical proposal timeline (oldest → newest). Appends a faded "voting closes" marker
 *  when `votingClosesAt` is still in the future. */
export function ProposalTimeline({
  events,
  createdAt,
  votingClosesAt,
}: {
  events: ProposalEvent[];
  createdAt: string;
  votingClosesAt: string | null;
}) {
  // Anchor with the creation moment if the backend timeline doesn't already start there.
  const hasCreated = events.some((e) => e.type === "created");
  const rows: ProposalEvent[] = hasCreated
    ? events
    : [{ type: "created", actor: null, detail: null, ts: createdAt }, ...events];

  // Only show the "voting closes" marker while it's genuinely in the future (computed on mount).
  const [showClose, setShowClose] = useState(false);
  useEffect(() => {
    if (!votingClosesAt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- compares to Date.now() on mount, not during render
    setShowClose(new Date(votingClosesAt).getTime() > Date.now());
  }, [votingClosesAt]);

  return (
    <section>
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-acid">Timeline</h2>
      <ol className="relative space-y-4 border-l border-border pl-6">
        {rows.map((e, i) => {
          const meta = EVENT_META[e.type];
          return (
            <li key={`${e.type}-${e.ts}-${i}`} className="relative">
              <span
                className="absolute -left-[2.1rem] grid size-6 place-items-center rounded-full bg-muted text-xs ring-4 ring-background"
                aria-hidden
              >
                {meta.emoji}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-sm">
                  <span className="font-semibold">{meta.label}</span>
                  {e.actor && <span className="text-muted-foreground"> · {e.actor}</span>}
                  {e.detail && <span className="text-muted-foreground"> — {e.detail}</span>}
                </p>
                <RelTime ts={e.ts} />
              </div>
            </li>
          );
        })}

        {showClose && votingClosesAt && (
          <li className="relative opacity-55">
            <span
              className="absolute -left-[2.1rem] grid size-6 place-items-center rounded-full bg-muted text-xs ring-4 ring-background"
              aria-hidden
            >
              🔻
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Voting closes</p>
              <CloseLabel ts={votingClosesAt} />
            </div>
          </li>
        )}
      </ol>
    </section>
  );
}
