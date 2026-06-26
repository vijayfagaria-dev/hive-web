"use client";

/*
  Community Governance — the data layer, now wired to the REAL backend
  (../hive-api `/proposals` + `/rulebook`). Everything is Zod-validated in api.ts
  and cached/mutated with TanStack Query, same-origin session cookie.

  The server owns the lifecycle and the passing conditions (quorum/majority/min-yes)
  and decides at the deadline — the client never computes pass/fail. We render off
  `phase`, show the live `tally` + `vote.myVote` + countdown to `votingClosesAt`,
  and refetch around the close.
*/
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  api,
  type ProposalChoice,
  type ProposalDetail,
  type ProposalEventType,
  type ProposalPhase,
  type ProposalTally,
  type ProposalType,
} from "./api";
import { qk } from "./queries";

// Re-export the contract types so components import them from one place.
export type {
  ProposalSummary,
  ProposalDetail,
  ProposalPhase,
  ProposalStatus,
  ProposalType,
  ProposalChoice,
  ProposalComment,
  ProposalEvent,
  ProposalEventType,
  ProposalTally,
  ProposalVoteState,
  RuleBookRule,
  RuleVersion,
  Member,
} from "./api";

/** The current member, for "is this mine?" checks. canVote/canEdit/canAdmin come from the server. */
export type GovUser = { id: number; name: string; role: "tenant" | "guest" };

// ─── UI vocabulary ───
export const PHASE_META: Record<ProposalPhase, { label: string; emoji: string }> = {
  draft: { label: "Draft", emoji: "📝" },
  review: { label: "Needs Review", emoji: "🟡" },
  voting: { label: "Active Voting", emoji: "🟢" },
  passed: { label: "Passed", emoji: "🔵" },
  rejected: { label: "Rejected", emoji: "🔴" },
  cancelled: { label: "Cancelled", emoji: "⚫" },
};

export const TYPE_META: Record<ProposalType, { label: string; emoji: string; verb: string }> = {
  new_rule: { label: "New rule", emoji: "➕", verb: "Add" },
  modify_rule: { label: "Modify rule", emoji: "✏️", verb: "Modify" },
  delete_rule: { label: "Delete rule", emoji: "🗑️", verb: "Remove" },
};

export const EVENT_META: Record<ProposalEventType, { emoji: string; label: string }> = {
  created: { emoji: "📝", label: "Drafted" },
  submitted: { emoji: "📤", label: "Submitted" },
  approved: { emoji: "✅", label: "Approved for voting" },
  voting_opened: { emoji: "🗳️", label: "Voting opened" },
  vote_cast: { emoji: "✋", label: "Vote cast" },
  commented: { emoji: "💬", label: "Commented" },
  extended: { emoji: "⏱️", label: "Deadline extended" },
  frozen: { emoji: "❄️", label: "Frozen" },
  voting_closed: { emoji: "🔒", label: "Voting closed" },
  passed: { emoji: "🎉", label: "Passed" },
  rejected: { emoji: "🚫", label: "Rejected" },
  expired: { emoji: "⌛", label: "Expired (no quorum)" },
  cancelled: { emoji: "🗑️", label: "Cancelled" },
  merged: { emoji: "📖", label: "Merged into the Rule Book" },
};

/** `proposedCategory` is free-form on the backend; these are composer presets. */
export const CATEGORY_PRESETS = [
  { key: "kitchen", label: "Kitchen", emoji: "🍳" },
  { key: "noise", label: "Noise", emoji: "🔊" },
  { key: "cleaning", label: "Cleaning", emoji: "🧹" },
  { key: "guests", label: "Guests", emoji: "🎟️" },
  { key: "bills", label: "Bills", emoji: "🧾" },
  { key: "smoking", label: "Smoking", emoji: "🚬" },
  { key: "bathroom", label: "Bathroom", emoji: "🚽" },
  { key: "general", label: "General", emoji: "🏠" },
] as const;

const CATEGORY_EMOJI = new Map<string, string>(CATEGORY_PRESETS.map((c) => [c.key, c.emoji]));
export function categoryEmoji(category: string | null | undefined): string {
  if (!category) return "🏠";
  return CATEGORY_EMOJI.get(category.toLowerCase()) ?? "🏷️";
}

/** Display-only hint; the real threshold is enforced server-side (PROPOSAL_PASS_PCT). */
export const PASS_PCT_HINT = 60;

// ─── derived helpers (display only — no pass/fail logic) ───
export function yesPct(t: { yes: number; no: number }): number {
  const decided = t.yes + t.no;
  return decided ? (t.yes / decided) * 100 : 0;
}
export const totalVotes = (t: ProposalTally): number => t.yes + t.no + t.abstain;
export function leaning(t: ProposalTally): "yes" | "no" | "tie" {
  if (t.yes > t.no) return "yes";
  if (t.no > t.yes) return "no";
  return "tie";
}
export const isLive = (phase: ProposalPhase): boolean => phase === "voting";
export const isOpen = (phase: ProposalPhase): boolean => phase === "draft" || phase === "review" || phase === "voting";
export const isResolved = (phase: ProposalPhase): boolean =>
  phase === "passed" || phase === "rejected" || phase === "cancelled";

// ─── query keys ───
export const gqk = {
  proposals: ["proposals"] as const,
  proposal: (id: number) => ["proposal", id] as const,
  proposalVotes: (id: number) => ["proposal-votes", id] as const,
  rulebook: ["rulebook"] as const,
  ruleVersions: (id: number) => ["rule-versions", id] as const,
};

function invalidateGov(qc: QueryClient, id?: number) {
  qc.invalidateQueries({ queryKey: gqk.proposals });
  if (id != null) qc.invalidateQueries({ queryKey: gqk.proposal(id) });
  qc.invalidateQueries({ queryKey: qk.notifications });
}

/** A passed/merged proposal changes the rule book + the rules surfaced in /me. */
function invalidateRulebook(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: gqk.rulebook });
  qc.invalidateQueries({ queryKey: qk.me });
  qc.invalidateQueries({ queryKey: qk.dashboard });
}

// ─── reads ───
export function useProposals() {
  return useQuery({ queryKey: gqk.proposals, queryFn: () => api.listProposals(), refetchOnWindowFocus: true });
}

export function useProposal(id: number) {
  return useQuery({
    queryKey: gqk.proposal(id),
    queryFn: () => api.proposal(id),
    enabled: Number.isFinite(id) && id > 0,
    refetchOnWindowFocus: true,
  });
}

export function useProposalVotes(id: number, enabled = true) {
  return useQuery({
    queryKey: gqk.proposalVotes(id),
    queryFn: () => api.proposalVotes(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  });
}

export function useRulebook() {
  return useQuery({ queryKey: gqk.rulebook, queryFn: api.rulebook });
}

export function useRuleVersions(ruleId: number, enabled = true) {
  return useQuery({
    queryKey: gqk.ruleVersions(ruleId),
    queryFn: () => api.ruleVersions(ruleId),
    enabled: enabled && Number.isFinite(ruleId) && ruleId > 0,
  });
}

// ─── proposal mutations ───
export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createProposal, onSuccess: () => invalidateGov(qc) });
}

export function useUpdateProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.updateProposal>[1]) => api.updateProposal(id, body),
    onSuccess: () => invalidateGov(qc, id),
  });
}

export function useSubmitProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.submitProposal(id), onSuccess: () => invalidateGov(qc, id) });
}

/** Optimistic vote — adjusts the detail tally (yes/no/abstain) instantly, reconciles on settle. */
export function useVoteProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vote: ProposalChoice) => api.voteProposal(id, vote),
    onMutate: async (vote) => {
      await qc.cancelQueries({ queryKey: gqk.proposal(id) });
      const prev = qc.getQueryData<ProposalDetail>(gqk.proposal(id));
      if (prev) {
        const was = prev.vote.myVote;
        const adj = (k: ProposalChoice) => (vote === k ? 1 : 0) - (was === k ? 1 : 0);
        qc.setQueryData<ProposalDetail>(gqk.proposal(id), {
          ...prev,
          vote: {
            ...prev.vote,
            yes: prev.vote.yes + adj("yes"),
            no: prev.vote.no + adj("no"),
            abstain: prev.vote.abstain + adj("abstain"),
            myVote: vote,
          },
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(gqk.proposal(id), ctx.prev);
    },
    onSettled: () => invalidateGov(qc, id),
  });
}

export function useCancelProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.cancelProposal(id), onSuccess: () => invalidateGov(qc, id) });
}

// ─── comments ───
export function useAddComment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { body: string; parentId?: number | null }) =>
      api.addProposalComment(id, vars.body, vars.parentId ?? null),
    onSuccess: () => invalidateGov(qc, id),
  });
}

export function useEditComment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { commentId: number; body: string }) => api.editProposalComment(id, vars.commentId, vars.body),
    onSuccess: () => invalidateGov(qc, id),
  });
}

export function useDeleteComment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => api.deleteProposalComment(id, commentId),
    onSuccess: () => invalidateGov(qc, id),
  });
}

// ─── admin (tenant) controls ───
export function useApproveProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.approveProposal(id), onSuccess: () => invalidateGov(qc, id) });
}

export function useRejectProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.rejectProposal(id), onSuccess: () => invalidateGov(qc, id) });
}

export function useExtendProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (hours: number) => api.extendProposal(id, hours), onSuccess: () => invalidateGov(qc, id) });
}

export function useFreezeProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (frozen: boolean) => api.freezeProposal(id, frozen), onSuccess: () => invalidateGov(qc, id) });
}

export function useForceMergeProposal(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.forceMergeProposal(id),
    onSuccess: () => {
      invalidateGov(qc, id);
      invalidateRulebook(qc);
    },
  });
}

// ─── rule book ───
export function useRollbackRule(ruleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionId: number) => api.rollbackRule(ruleId, versionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gqk.ruleVersions(ruleId) });
      invalidateRulebook(qc);
    },
  });
}
