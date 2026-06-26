import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  emoji,
  title,
  note,
  action,
  className,
}: {
  emoji: string;
  title: string;
  note?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="text-4xl" aria-hidden>
        {emoji}
      </div>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3>
      {note && <p className="mt-1 max-w-xs text-pretty text-sm text-muted-foreground">{note}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
