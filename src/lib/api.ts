import { z } from "zod";

/*
  The API contract. These Zod schemas are the single source of truth: every
  response is validated at runtime, and the TS types are inferred from them — so
  the FastAPI JSON and the frontend can't drift apart silently.
  All requests go to the same-origin /api/* (Next proxies it to FastAPI).
*/

export const Member = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string().nullable(),
  role: z.enum(["tenant", "guest"]),
});
export type Member = z.infer<typeof Member>;

export const Rule = z.object({
  id: z.number(),
  category: z.string(),
  text: z.string(),
  amount: z.number(),
  isFavorite: z.boolean(),
});
export type Rule = z.infer<typeof Rule>;

export const ShameRow = z.object({ name: z.string(), fines: z.number(), total: z.number() });
export type ShameRow = z.infer<typeof ShameRow>;

export const DuesRow = z.object({
  name: z.string(),
  fines: z.number(),
  bills: z.number(),
  total: z.number(),
});
export type DuesRow = z.infer<typeof DuesRow>;

export const OverturnRow = z.object({
  name: z.string(),
  filed: z.number(),
  upheld: z.number(),
  overturned: z.number(),
  overturnRate: z.number(),
});

export const RecentFine = z.object({
  id: z.number(),
  accused: z.string(),
  accuser: z.string(),
  rule: z.string().nullable(),
  amount: z.number(),
  status: z.enum(["pending", "confirmed", "disputed", "void", "upheld"]),
  paid: z.boolean(),
  date: z.string(),
});

export const UnpaidFine = z.object({ id: z.number(), amount: z.number(), rule: z.string().nullable() });
export type UnpaidFine = z.infer<typeof UnpaidFine>;

export const GettingHere = z
  .object({
    address: z.string().optional(),
    place: z.string().optional(),
    directions: z.string().optional(),
    geo: z.string().optional(),
    uber: z.string().optional(),
    ola: z.string().optional(),
    rapido: z.string().optional(),
  })
  .nullable();
export type GettingHere = z.infer<typeof GettingHere>;

// --- Endpoint response schemas ---
const AuthMe = z.object({ member: Member.nullable() });
const AuthResult = z.object({ member: Member });
const Ok = z.object({ ok: z.boolean() });

export const MeResponse = z.object({
  member: Member,
  rulesByCategory: z.record(z.string(), z.array(Rule)),
  members: z.array(Member),
  hallOfShame: z.array(ShameRow),
  gettingHere: GettingHere,
});
export type MeResponse = z.infer<typeof MeResponse>;

export const DashboardResponse = z.object({
  pot: z.number(),
  potCount: z.number(),
  dues: z.array(DuesRow),
  recentFines: z.array(RecentFine),
  overturn: z.array(OverturnRow),
});
export type DashboardResponse = z.infer<typeof DashboardResponse>;

export const PayResponse = z.object({ unpaid: z.array(UnpaidFine), walletQr: z.string().nullable() });

export const SpotResponse = z.object({
  spot: z.string(),
  config: z.object({
    emoji: z.string(),
    title: z.string(),
    category: z.string().nullable(),
    shame: z.boolean(),
  }),
  member: Member.nullable(),
  isTenant: z.boolean(),
  rules: z.array(Rule),
  members: z.array(Member),
  pot: z.number(),
  potCount: z.number(),
  hallOfShame: z.array(ShameRow),
});
export type SpotResponse = z.infer<typeof SpotResponse>;

export const PublicStats = z.object({
  pot: z.number(),
  potCount: z.number(),
  hallOfShame: z.array(ShameRow),
});
export type PublicStats = z.infer<typeof PublicStats>;

// --- Typed client ---
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const ErrorBody = z.object({ detail: z.string() }).partial();

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ErrorBody.safeParse(raw);
    throw new ApiError(res.status, parsed.success && parsed.data.detail ? parsed.data.detail : res.statusText);
  }
  return schema.parse(raw);
}

type Credentials = { username: string; password: string };
type ReportBody = { accusedId: number; ruleId: number };

export const api = {
  authMe: () => request("/auth/me", AuthMe),
  register: (body: Credentials) =>
    request("/auth/register", AuthResult, { method: "POST", body: JSON.stringify(body) }),
  login: (body: Credentials) =>
    request("/auth/login", AuthResult, { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/auth/logout", Ok, { method: "POST" }),
  me: () => request("/me", MeResponse),
  dashboard: () => request("/dashboard", DashboardResponse),
  report: (body: ReportBody) =>
    request("/report", Ok, { method: "POST", body: JSON.stringify(body) }),
  pay: () => request("/pay", PayResponse),
  payFine: (id: number) =>
    request(`/pay/${id}`, z.object({ paid: z.boolean(), changed: z.boolean() }), { method: "POST" }),
  spot: (spot: string) => request(`/spots/${spot}`, SpotResponse),
  publicStats: () => request("/public/stats", PublicStats),
};
