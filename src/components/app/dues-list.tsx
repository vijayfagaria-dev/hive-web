import type { Due } from "@/lib/api";
import { Avatar } from "./avatar";

const inr = (n: number) => n.toLocaleString("en-IN");

/** Who owes what — biggest debtor first. */
export function DuesList({ dues }: { dues: Due[] }) {
  const sorted = [...dues].sort((a, b) => b.total - a.total);
  return (
    <ul className="divide-y divide-border">
      {sorted.map((d) => (
        <li key={d.memberId} className="flex items-center gap-3 py-3">
          <Avatar name={d.name} className="size-8 text-xs" />
          <span className="flex-1 truncate font-medium">{d.name}</span>
          <span className="hidden text-right text-xs text-muted-foreground sm:block">
            ₹{inr(d.fines)} fines · ₹{inr(d.bills)} bills
          </span>
          <span className="w-24 text-right font-semibold tabular-nums">₹{inr(d.total)}</span>
        </li>
      ))}
    </ul>
  );
}
