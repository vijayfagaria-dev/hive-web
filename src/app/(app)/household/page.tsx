"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import type { MemberAdmin } from "@/lib/api";
import { useHouseholdMembers, useMe } from "@/lib/queries";
import { Avatar } from "@/components/app/avatar";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBadge } from "@/components/household/role-badge";
import { ManageMemberSheet } from "@/components/household/manage-member-sheet";
import { InvitePanel } from "@/components/household/invite-panel";
import { cn } from "@/lib/utils";

const joined = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
};

export default function HouseholdPage() {
  const me = useMe().data?.member;
  const canManage = me?.role === "tenant";
  const { data, isPending, isError } = useHouseholdMembers(canManage);
  const [selected, setSelected] = useState<MemberAdmin | null>(null);

  if (isPending) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-8">
        <Skeleton className="h-9 w-40" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </main>
    );
  }
  if (isError || !data) {
    return (
      <EmptyState emoji="🤷" title="Couldn't load the household" note="Try again in a moment." className="min-h-[60svh]" />
    );
  }

  const members = data.members;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 py-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">🏠 Household</p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {canManage ? "Manage who's in the flat — roles, invites, and removals." : "Everyone currently in the flat."}
        </p>
      </header>

      <ul className="space-y-2">
        {members.map((m) => {
          const isYou = me?.id === m.id;
          const manageable = canManage && m.isActive && !isYou;
          return (
            <li
              key={m.id}
              className={cn("glass flex items-center gap-3 rounded-2xl p-4 transition-shadow", !m.isActive && "opacity-60")}
            >
              <Avatar name={m.name} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {m.name}
                  {isYou && <span className="font-normal text-muted-foreground"> · you</span>}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <RoleBadge role={m.role} />
                  {m.isActive ? (
                    joined(m.joinedOn) && <span className="text-xs text-muted-foreground">joined {joined(m.joinedOn)}</span>
                  ) : (
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">left</span>
                  )}
                </div>
              </div>
              {manageable && (
                <button
                  type="button"
                  onClick={() => setSelected(m)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-acid hover:text-foreground"
                >
                  <Settings2 className="size-3.5" /> Manage
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {canManage && <InvitePanel />}

      <ManageMemberSheet member={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
