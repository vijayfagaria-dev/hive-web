"use client";

import { useEffect, useState } from "react";
import { ApiError, type MemberAdmin } from "@/lib/api";
import { useRemoveMember, useRenameMember, useSetMemberRole } from "@/lib/queries";
import { Sheet } from "@/components/app/sheet";
import { Avatar } from "@/components/app/avatar";
import { RoleBadge } from "./role-badge";
import { cn } from "@/lib/utils";

/** Bottom-sheet of admin actions for one member: rename, promote/demote, remove. */
export function ManageMemberSheet({ member, onClose }: { member: MemberAdmin | null; onClose: () => void }) {
  const setRole = useSetMemberRole();
  const rename = useRenameMember();
  const remove = useRemoveMember();
  const [name, setName] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed form from the selected member
    setName(member?.name ?? "");
    setConfirmRemove(false);
    setError(null);
  }, [member]);

  const busy = setRole.isPending || rename.isPending || remove.isPending;

  function run(p: Promise<unknown>, after?: () => void) {
    setError(null);
    p.then(() => after?.()).catch((e) =>
      setError(e instanceof ApiError ? e.message : "Something went wrong — try again."),
    );
  }

  const otherRole = member?.role === "tenant" ? "guest" : "tenant";

  return (
    <Sheet open={!!member} onClose={onClose} title={member ? `Manage ${member.name}` : ""}>
      {member && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar name={member.name} className="size-11" />
            <div>
              <p className="font-semibold">{member.name}</p>
              <div className="mt-1">
                <RoleBadge role={member.role} />
              </div>
            </div>
          </div>

          {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          {/* Rename */}
          <div>
            <label className="mb-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
              Display name
            </label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="h-11 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
              <button
                type="button"
                disabled={busy || !name.trim() || name.trim() === member.name}
                onClick={() => run(rename.mutateAsync({ id: member.id, name: name.trim() }))}
                className="rounded-xl bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <p className="mb-1.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Role</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(setRole.mutateAsync({ id: member.id, role: otherRole }))}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold transition-colors hover:border-acid disabled:opacity-40"
            >
              {member.role === "guest" ? "⬆️ Promote to tenant (admin)" : "⬇️ Make guest"}
            </button>
          </div>

          {/* Remove */}
          <div className="border-t border-border pt-4">
            {!confirmRemove ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmRemove(true)}
                className="w-full rounded-xl border border-destructive/40 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
              >
                Remove from household
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Remove <span className="font-semibold text-foreground">{member.name}</span>? They lose access immediately
                  (their fines &amp; history stay on record).
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmRemove(false)}
                    className="rounded-xl border border-border py-2.5 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(remove.mutateAsync(member.id), onClose)}
                    className={cn("rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white disabled:opacity-50")}
                  >
                    {remove.isPending ? "Removing…" : "Confirm remove"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
