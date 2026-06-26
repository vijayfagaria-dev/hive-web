import type { ShameRow } from "@/lib/api";
import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"];

export function ShameLeaderboard({ rows }: { rows: ShameRow[] }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((r, i) => (
        <li key={r.name + i} className="flex items-center gap-3 py-3">
          <span className="w-6 shrink-0 text-center font-mono text-sm tabular-nums text-muted-foreground">
            {i < 3 ? MEDALS[i] : i + 1}
          </span>
          <Avatar name={r.name} className="size-8 text-xs" />
          <span className="flex-1 truncate font-semibold">{r.name}</span>
          <span className="hidden font-mono text-xs uppercase tracking-wide text-muted-foreground sm:block">
            {r.fines} {r.fines === 1 ? "fine" : "fines"}
          </span>
          <span className={cn("w-16 text-right font-semibold tabular-nums", i === 0 && "text-acid")}>
            ₹{r.total.toLocaleString("en-IN")}
          </span>
        </li>
      ))}
    </ul>
  );
}
