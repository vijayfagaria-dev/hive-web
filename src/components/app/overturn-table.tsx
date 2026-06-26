import type { Overturn } from "@/lib/api";
import { cn } from "@/lib/utils";

/** The "biggest false-reporter 🏆" leaderboard. */
export function OverturnTable({ rows }: { rows: Overturn[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-2 font-medium">Member</th>
            <th className="px-2 py-2 text-right font-medium">Filed</th>
            <th className="px-2 py-2 text-right font-medium">Upheld</th>
            <th className="px-2 py-2 text-right font-medium">Void</th>
            <th className="py-2 pl-2 text-right font-medium">Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.name} className="border-b border-border last:border-0">
              <td className="py-2.5 pr-2 font-medium">{o.name}</td>
              <td className="px-2 py-2.5 text-right tabular-nums">{o.filed}</td>
              <td className="px-2 py-2.5 text-right tabular-nums">{o.upheld}</td>
              <td className="px-2 py-2.5 text-right tabular-nums">{o.overturned}</td>
              <td className={cn("py-2.5 pl-2 text-right tabular-nums", o.overturnRate > 40 && "font-semibold text-destructive")}>
                {o.overturnRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
