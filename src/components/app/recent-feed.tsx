import Link from "next/link";
import type { RecentComplaint } from "@/lib/api";
import { Avatar } from "./avatar";
import { PhaseChip } from "./phase-chip";

/** Recent complaints as tappable receipt-style cards → complaint detail. */
export function RecentFeed({ items }: { items: RecentComplaint[] }) {
  return (
    <ul className="space-y-2">
      {items.map((f) => (
        <li key={f.id}>
          <Link
            href={`/complaints/${f.id}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-acid/40"
          >
            <Avatar name={f.accused} className="size-9 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {f.accused} <span className="font-normal text-muted-foreground">· {f.rule ?? "ad-hoc fine"}</span>
              </p>
              <p className="font-mono text-[0.7rem] text-muted-foreground">
                by {f.accuser} · {f.date}
                {f.paid && " · paid"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-semibold tabular-nums">₹{f.amount}</span>
              <PhaseChip status={f.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
