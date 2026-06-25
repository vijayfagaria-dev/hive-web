"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "./api";

export const qk = {
  auth: ["auth"] as const,
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,
  pay: ["pay"] as const,
  spot: (s: string) => ["spot", s] as const,
  publicStats: ["public-stats"] as const,
};

/** Invalidate everything that a fine/pay can change. */
function invalidateData(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: qk.me });
  qc.invalidateQueries({ queryKey: qk.dashboard });
  qc.invalidateQueries({ queryKey: qk.pay });
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

export function useReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.report, onSuccess: () => invalidateData(qc) });
}

export function usePayFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.payFine(id),
    onSuccess: () => invalidateData(qc),
  });
}
