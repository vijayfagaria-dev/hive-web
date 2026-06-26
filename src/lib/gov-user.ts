"use client";

import { useMe } from "@/lib/queries";
import type { GovUser } from "@/lib/governance";

/** The current authenticated member, for ownership checks ("mine", own comments).
 *  Permission gating (canVote/canEdit/canAdmin) comes from the server on the detail. */
export function useGovMe(): GovUser | null {
  const m = useMe().data?.member;
  return m ? { id: m.id, name: m.name, role: m.role } : null;
}
