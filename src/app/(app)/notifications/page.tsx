"use client";

import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import type { Notification } from "@/lib/api";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/lib/queries";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ICON: Record<string, string> = {
  complaint_raised: "🚨",
  vote_requested: "🗳️",
  complaint_registered: "✅",
  complaint_resolved: "⚖️",
  // governance
  proposal_voting: "🗳️",
  proposal_comment: "💬",
  proposal_resolved: "📜",
  proposal_review: "🧐",
  rule_published: "📖",
};

function dayKey(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}
const time = (ts: string) => new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export default function NotificationsPage() {
  const router = useRouter();
  const { data, isPending, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (isPending) {
    return (
      <main className="mx-auto max-w-xl space-y-3 px-5 py-8">
        <Skeleton className="h-9 w-48" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </main>
    );
  }
  if (isError || !data) {
    return <EmptyState emoji="🤷" title="Couldn't load notifications" className="min-h-[60svh]" />;
  }

  const groups: Record<string, Notification[]> = {};
  for (const n of data.notifications) (groups[dayKey(n.ts)] ??= []).push(n);

  function open(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    if (n.proposalId) router.push(`/governance/proposals/${n.proposalId}`);
    else if (n.fineId) router.push(`/complaints/${n.fineId}`);
    else if (n.billId) router.push("/bills");
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-tight">🔔 Notifications</h1>
        {data.unread > 0 && (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <CheckCheck className="size-3.5" /> Read all
          </button>
        )}
      </div>

      {data.notifications.length === 0 ? (
        <EmptyState emoji="📭" title="All caught up" note="No notifications yet — behave, or don't." className="min-h-[50svh]" />
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(groups).map(([day, items]) => (
            <div key={day}>
              <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{day}</h2>
              <ul className="space-y-2">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => open(n)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                        n.read ? "border-border bg-card" : "border-acid/40 bg-primary/5",
                      )}
                    >
                      <span className="text-xl" aria-hidden>
                        {ICON[n.kind] ?? "🔔"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{n.title}</span>
                        {n.body && <span className="block text-sm text-muted-foreground">{n.body}</span>}
                        <span className="mt-0.5 block font-mono text-[0.65rem] text-muted-foreground">
                          {time(n.ts)}
                          {n.fineId || n.proposalId || n.billId ? " · tap to open" : ""}
                        </span>
                      </span>
                      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-acid" aria-hidden />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
