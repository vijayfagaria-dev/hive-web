import { Trash2 } from "lucide-react";
import type { Expense } from "@/lib/api";
import { catEmoji } from "@/lib/categories";

const inr = (n: number) => n.toLocaleString("en-IN");

/** Expense rows — "A paid ₹X for …". With `onDelete`, the payer's own rows get a delete
 *  control (only the payer may delete; the API enforces it too). */
export function ExpenseList({
  expenses,
  onDelete,
  meId,
}: {
  expenses: Expense[];
  onDelete?: (id: number) => void;
  meId?: number | null;
}) {
  return (
    <ul className="space-y-2">
      {expenses.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {catEmoji(e.category)} {e.payerName} paid <b className="tabular-nums">₹{inr(e.amount)}</b>
            </p>
            <p className="text-xs text-muted-foreground">
              {e.description || e.category} · {e.month}
              {e.status === "void" ? " · deleted" : ""}
            </p>
          </div>
          {onDelete && e.payerId === meId && e.status !== "void" && (
            <button
              type="button"
              onClick={() => onDelete(e.id)}
              className="shrink-0 rounded-full p-2 text-muted-foreground hover:text-destructive"
              aria-label="Delete expense"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
