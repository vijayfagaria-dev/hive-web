import type { EventType, TimelineEvent } from "@/lib/api";

const LABEL: Record<EventType, string> = {
  raised: "Complaint filed",
  accused_notified: "Accused notified",
  accepted: "Accepted",
  disputed: "Denied",
  voting_started: "Vote opened",
  members_notified: "Voters notified",
  vote_cast: "Vote cast",
  vote_finalized: "Vote finalized",
  auto_confirmed: "Auto-confirmed",
  payment_due: "Registered — payment due",
  overdue: "Payment overdue",
  paid: "Marked paid into the pot",
  settled: "Settled",
};

function when(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function StatusTracker({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-4 pl-6">
      <span className="absolute bottom-2 left-[6px] top-2 w-px bg-border" aria-hidden />
      {timeline.map((e, i) => {
        const last = i === timeline.length - 1;
        return (
          <li key={i} className="relative">
            <span
              className={`absolute -left-[22px] top-1 size-3.5 rounded-full border-2 border-background ${last ? "bg-acid" : "bg-muted-foreground/40"}`}
              aria-hidden
            />
            <p className="text-sm font-medium">
              {LABEL[e.type] ?? e.type}
              {e.actor && <span className="font-normal text-muted-foreground"> · {e.actor}</span>}
            </p>
            {e.detail && <p className="text-xs text-muted-foreground">{e.detail}</p>}
            <p className="font-mono text-[0.65rem] text-muted-foreground">{when(e.ts)}</p>
          </li>
        );
      })}
    </ol>
  );
}
