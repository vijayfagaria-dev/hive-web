import type { RentStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const inr = (n: number) => n.toLocaleString("en-IN");

/** A month's rent: collected vs target, then each tenant's share and what they've fronted. */
export function RentProgress({ data }: { data: RentStatus }) {
  const pct = Math.min(100, Math.round((data.collected / data.target) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Rent · {data.month}</span>
        <span className={cn("font-semibold tabular-nums", data.complete ? "text-acid" : "text-muted-foreground")}>
          ₹{inr(data.collected)} / ₹{inr(data.target)}
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", data.complete ? "bg-acid" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {data.complete ? "Rent complete for the month 🎉" : `₹${inr(data.remaining)} still to collect.`}
      </p>
      <ul className="mt-3 space-y-1.5">
        {data.perTenant.map((p) => (
          <li key={p.memberId} className="flex items-center justify-between text-sm">
            <span>
              {p.name}
              <span className="text-muted-foreground"> · {Math.round((p.target / data.target) * 100)}%</span>
            </span>
            <span className={cn("tabular-nums", p.paid >= p.target ? "text-acid" : "text-muted-foreground")}>
              ₹{inr(p.paid)} / ₹{inr(p.target)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
