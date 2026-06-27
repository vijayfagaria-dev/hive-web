"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, type ComplaintDetail, type Role, type Vote } from "./api";

export const qk = {
  auth: ["auth"] as const,
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,
  pay: ["pay"] as const,
  spot: (s: string) => ["spot", s] as const,
  publicStats: ["public-stats"] as const,
  complaint: (id: number) => ["complaint", id] as const,
  notifications: ["notifications"] as const,
  householdMembers: ["household-members"] as const,
  member: (id: number) => ["household-member", id] as const,
  invites: ["household-invites"] as const,
  money: ["money"] as const,
  balances: ["money-balances"] as const,
  settlements: ["money-settlements"] as const,
};

/** Invalidate everything that a complaint/pay action can change. */
function invalidateData(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: qk.me });
  qc.invalidateQueries({ queryKey: qk.dashboard });
  qc.invalidateQueries({ queryKey: qk.pay });
  qc.invalidateQueries({ queryKey: qk.notifications });
  qc.invalidateQueries({ queryKey: qk.publicStats });
  qc.invalidateQueries({ queryKey: qk.money });
  qc.invalidateQueries({ queryKey: qk.balances });
  qc.invalidateQueries({ queryKey: qk.settlements });
}

export function useAuth() {
  return useQuery({ queryKey: qk.auth, queryFn: api.authMe, staleTime: 60_000 });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      qc.setQueryData(qk.auth, { member: data.member });
      invalidateData(qc);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.register,
    onSuccess: (data) => {
      qc.setQueryData(qk.auth, { member: data.member });
      invalidateData(qc);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      qc.setQueryData(qk.auth, { member: null });
      qc.clear();
    },
  });
}

export function useMe() {
  return useQuery({ queryKey: qk.me, queryFn: api.me });
}

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: api.dashboard });
}

export function usePay() {
  return useQuery({ queryKey: qk.pay, queryFn: api.pay });
}

export function useSpot(spot: string) {
  return useQuery({ queryKey: qk.spot(spot), queryFn: () => api.spot(spot) });
}

export function usePublicStats() {
  return useQuery({ queryKey: qk.publicStats, queryFn: api.publicStats });
}

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createComplaint, onSuccess: () => invalidateData(qc) });
}

export function usePayFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.payFine(id),
    onSuccess: () => invalidateData(qc),
  });
}

export function useCreateBill() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createBill, onSuccess: () => invalidateData(qc) });
}

export function useDisputeBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, reason }: { billId: number; reason?: string }) => api.disputeBill(billId, reason),
    onSuccess: () => invalidateData(qc),
  });
}

// ─── the complaint loop ───
export function useComplaint(id: number) {
  return useQuery({
    queryKey: qk.complaint(id),
    queryFn: () => api.complaint(id),
    enabled: Number.isFinite(id) && id > 0,
    refetchOnWindowFocus: true,
  });
}

export function useAccept(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.complaint(id) });
      invalidateData(qc);
    },
  });
}

export function useDispute(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => api.dispute(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.complaint(id) });
      invalidateData(qc);
    },
  });
}

/** Optimistic vote — flips your tally instantly, then reconciles with server truth. */
export function useVote(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vote: Vote) => api.vote(id, vote),
    onMutate: async (vote) => {
      await qc.cancelQueries({ queryKey: qk.complaint(id) });
      const prev = qc.getQueryData<ComplaintDetail>(qk.complaint(id));
      if (prev) {
        const was = prev.vote.myVote;
        qc.setQueryData<ComplaintDetail>(qk.complaint(id), {
          ...prev,
          vote: {
            ...prev.vote,
            uphold: prev.vote.uphold + (vote === "uphold" ? 1 : 0) - (was === "uphold" ? 1 : 0),
            void: prev.vote.void + (vote === "void" ? 1 : 0) - (was === "void" ? 1 : 0),
            myVote: vote,
          },
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.complaint(id), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.complaint(id) });
      invalidateData(qc);
    },
  });
}

// ─── notifications ───
export function useNotifications(unread = false) {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => api.notifications(unread),
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

// ─── account & push ───
export function usePushPublicKey() {
  return useQuery({ queryKey: ["push-key"] as const, queryFn: api.pushPublicKey, staleTime: Infinity, retry: false });
}

export function useSetEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string | null) => api.setEmail(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.auth });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useSetWhatsapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (whatsapp: string | null) => api.setWhatsapp(whatsapp),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.auth });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: api.changePassword });
}

// ─── household user management ───
/** A member change (role/remove/rename) ripples into the roster + /me + dashboard. */
function invalidateHousehold(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: qk.householdMembers });
  qc.invalidateQueries({ queryKey: qk.me });
  qc.invalidateQueries({ queryKey: qk.dashboard });
}

export function useHouseholdMembers(includeInactive = false) {
  return useQuery({
    queryKey: [...qk.householdMembers, includeInactive] as const,
    queryFn: () => api.listMembers(includeInactive),
  });
}

export function useMember(id: number) {
  return useQuery({
    queryKey: qk.member(id),
    queryFn: () => api.getMember(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useSetMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => api.setMemberRole(id, role),
    onSuccess: (_d, v) => {
      invalidateHousehold(qc);
      qc.invalidateQueries({ queryKey: qk.member(v.id) });
    },
  });
}

export function useRenameMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.renameMember(id, name),
    onSuccess: (_d, v) => {
      invalidateHousehold(qc);
      qc.invalidateQueries({ queryKey: qk.member(v.id) });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.removeMember(id),
    onSuccess: () => invalidateHousehold(qc),
  });
}

export function useInvites() {
  return useQuery({ queryKey: qk.invites, queryFn: api.listInvites });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { role: Role; email?: string | null; name?: string | null }) => api.inviteMember(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invites }),
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.revokeInvite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invites }),
  });
}

export function usePreviewInvite(token: string) {
  return useQuery({
    queryKey: ["invite-preview", token] as const,
    queryFn: () => api.previewInvite(token),
    enabled: !!token,
    retry: false,
  });
}

// ─── Money ledger ───
export function useMyMoney() {
  return useQuery({ queryKey: qk.money, queryFn: api.myMoney });
}

export function useBalances(enabled = true) {
  return useQuery({ queryKey: qk.balances, queryFn: api.balances, enabled });
}

export function useSettlements(enabled = true) {
  return useQuery({ queryKey: qk.settlements, queryFn: api.settlementsList, enabled });
}

export function useSetRentShares() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shares: Record<number, number>) => api.setRentShares(shares),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.householdMembers });
      invalidateData(qc);
    },
  });
}

export function useAddCharge() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.addCharge, onSuccess: () => invalidateData(qc) });
}

export function useAddCredit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.addCredit, onSuccess: () => invalidateData(qc) });
}

export function useCloseSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => api.closeSettlement(note),
    onSuccess: () => invalidateData(qc),
  });
}
