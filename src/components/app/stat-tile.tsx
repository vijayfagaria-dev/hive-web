import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** One headline number: label · value · optional note. `tone` tints only the value, and the
 *  label/note always say what it means — the colour is never the only signal. */
export function StatTile({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-heading text-3xl font-bold tabular-nums tracking-tight",
          tone === "good" && "text-acid",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
