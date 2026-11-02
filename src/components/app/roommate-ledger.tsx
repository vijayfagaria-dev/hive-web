import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";

const inr = (n: number) => n.toLocaleString("en-IN");

type Row = { memberId: number; name: string; net: number; rentSharePct?: number | null };

/** Who's up, who's down — every tenant's net with a worded status pill. */
export function RoommateLedger({ rows, meId }: { rows: Row[]; meId?: number | null }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.memberId} className="flex items-center gap-3 text-sm">
          <Avatar name={r.name} className="size-8 text-xs" />
          <span className="min-w-0 flex-1 truncate">
            {r.memberId === meId ? "You" : r.name}
            {r.rentSharePct != null && <span className="text-muted-foreground"> · {r.rentSharePct}%</span>}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
              r.net < 0 ? "bg-destructive/10 text-destructive" : r.net > 0 ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {r.net < 0 ? `Owes ₹${inr(-r.net)}` : r.net > 0 ? `Gets ₹${inr(r.net)}` : "Settled"}
          </span>
        </li>
      ))}
    </ul>
  );
}
