import { z } from "zod";

/*
  The API contract. These Zod schemas are the single source of truth: every
  response is validated at runtime and the TS types are inferred from them, so the
  FastAPI JSON and the frontend can't drift apart silently. All requests go to the
  same-origin /api/* (Next proxies it to FastAPI); session is the `hive_session`
  cookie, so always send credentials. Verified against ../hive-api (the code wins).
*/

// ─── Enums (exact backend values) ───
export const Role = z.enum(["tenant", "guest"]);
export type Role = z.infer<typeof Role>;

export const Status = z.enum(["pending", "confirmed", "disputed", "upheld", "void"]);
export type Status = z.infer<typeof Status>;

export const Phase = z.enum(["raised", "registered", "voting", "rejected"]);
export type Phase = z.infer<typeof Phase>;

export const Resolution = z.enum(["accepted", "auto_confirmed", "upheld", "void"]);
export type Resolution = z.infer<typeof Resolution>;

export const Vote = z.enum(["uphold", "void"]);
export type Vote = z.infer<typeof Vote>;

export const EventType = z.enum([
  "raised", "accused_notified", "accepted", "disputed", "voting_started",
  "members_notified", "vote_cast", "vote_finalized", "auto_confirmed", "paid",
]);
export type EventType = z.infer<typeof EventType>;

export const ProofSource = z.enum(["upload", "telegram"]);
export type ProofSource = z.infer<typeof ProofSource>;

export const BillType = z.enum(["rent", "house_help", "electricity", "water"]);
export type BillType = z.infer<typeof BillType>;

export const SpotName = z.enum([
  "front_door", "fridge", "kitchen", "balcony", "living_room", "bathroom",
]);
export type SpotName = z.infer<typeof SpotName>;

// `kind` is a free-form string at the call sites (not a DB enum) — keep it loose.
export type NotificationKind =
  | "complaint_raised" | "vote_requested" | "complaint_registered" | "complaint_resolved"
  | (string & {});

/** status → what the UI renders (the backend's PHASE map). */
export const PHASE_OF: Record<Status, Phase> = {
  pending: "raised",
  confirmed: "registered",
  disputed: "voting",
  upheld: "registered",
  void: "rejected",
};

// ─── Primitives ───
export const Member = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string().nullable(),
  role: Role,
});
export type Member = z.infer<typeof Member>;

/** Your own member — adds private contact fields. */
export const SelfMember = Member.extend({
  email: z.string().nullable(),
  whatsapp: z.string().nullable(),
});
export type SelfMember = z.infer<typeof SelfMember>;

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

export const Overturn = z.object({
  name: z.string(),
  filed: z.number(),
  upheld: z.number(),
  overturned: z.number(),
  overturnRate: z.number(),
});
export type Overturn = z.infer<typeof Overturn>;

// ⚠️ /dashboard `dues` is the ONLY snake_case response — normalize to camelCase on ingest.
export const Due = z
  .object({
    member_id: z.number(),
    name: z.string(),
    fines: z.number(),
    bills: z.number(),
    total: z.number(),
  })
  .transform((d) => ({ memberId: d.member_id, name: d.name, fines: d.fines, bills: d.bills, total: d.total }));
export type Due = z.infer<typeof Due>;

export const RecentComplaint = z.object({
  id: z.number(),
  accused: z.string(),
  accuser: z.string(),
  rule: z.string().nullable(),
  amount: z.number(),
  status: Status,
  paid: z.boolean(),
  date: z.string(),
});
export type RecentComplaint = z.infer<typeof RecentComplaint>;

export const Proof = z.object({
  id: z.number(),
  source: ProofSource,
  contentType: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  url: z.string().nullable(), // already prefixed with /api for uploads; null for legacy telegram
});
export type Proof = z.infer<typeof Proof>;

export const TimelineEvent = z.object({
  type: EventType,
  actor: z.string().nullable(),
  detail: z.string().nullable(),
  ts: z.string(),
});
export type TimelineEvent = z.infer<typeof TimelineEvent>;

export const Notification = z.object({
  id: z.number(),
  kind: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  fineId: z.number().nullable(),
  read: z.boolean(),
  ts: z.string(),
});
export type Notification = z.infer<typeof Notification>;

export const GettingHere = z
  .object({
    address: z.string(),
    place: z.string().optional(),
    directions: z.string().optional(),
    geo: z.string().optional(),
    uber: z.string().optional(),
    ola: z.string().optional(),
    rapido: z.string().optional(),
  })
  .nullable();
export type GettingHere = z.infer<typeof GettingHere>;

export const UnpaidFine = z.object({ id: z.number(), amount: z.number(), rule: z.string().nullable() });
export type UnpaidFine = z.infer<typeof UnpaidFine>;

export const VoteTally = z.object({
  uphold: z.number(),
  void: z.number(),
  eligible: z.number(),
  myVote: Vote.nullable(),
});

export const ComplaintDetail = z.object({
  id: z.number(),
  phase: Phase,
  status: Status,
  resolution: Resolution.nullable(),
  accused: Member.nullable(),
  accuser: Member.nullable(),
  rule: z.string().nullable(),
  amount: z.number(),
  paid: z.boolean(),
  disputeReason: z.string().nullable(),
  coolingDeadline: z.string().nullable(),
  voteDeadline: z.string().nullable(),
  proofs: z.array(Proof),
  timeline: z.array(TimelineEvent),
  vote: VoteTally,
  canAccept: z.boolean(),
  canDispute: z.boolean(),
  canVote: z.boolean(),
});
export type ComplaintDetail = z.infer<typeof ComplaintDetail>;

// ─── Endpoint response schemas ───
const AuthMe = z.object({ member: SelfMember.nullable() });
const AuthResult = z.object({ member: SelfMember });
const Ok = z.object({ ok: z.boolean() });

export const MeResponse = z.object({
  member: SelfMember,
  rulesByCategory: z.record(z.string(), z.array(Rule)),
  members: z.array(Member),
  hallOfShame: z.array(ShameRow),
  gettingHere: GettingHere,
});
export type MeResponse = z.infer<typeof MeResponse>;

export const DashboardResponse = z.object({
  pot: z.number(),
  potCount: z.number(),
  dues: z.array(Due),
  recentFines: z.array(RecentComplaint),
  overturn: z.array(Overturn),
});
export type DashboardResponse = z.infer<typeof DashboardResponse>;

export const PayResponse = z.object({ unpaid: z.array(UnpaidFine), walletQr: z.string().nullable() });
export type PayResponse = z.infer<typeof PayResponse>;

export const SpotResponse = z.object({
  spot: z.string(),
  config: z.object({
    emoji: z.string(),
    title: z.string(),
    category: z.string().nullable(),
    shame: z.boolean(),
  }),
  member: SelfMember.nullable(),
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

export const NotificationsResponse = z.object({
  notifications: z.array(Notification),
  unread: z.number(),
});
export type NotificationsResponse = z.infer<typeof NotificationsResponse>;

const ComplaintCreated = z.object({ ok: z.boolean(), complaintId: z.number() });
const AcceptResult = z.object({ ok: z.boolean(), accepted: z.boolean() });
const DisputeResult = z.object({ ok: z.boolean(), votingOpened: z.boolean() });
const VoteResult = z.object({
  ok: z.boolean(),
  status: Status,
  phase: Phase,
  tally: z.object({ uphold: z.number(), void: z.number() }),
});
const PayFineResult = z.object({ paid: z.boolean(), changed: z.boolean() });
const BillCreated = z.object({ ok: z.boolean(), billId: z.number() });
const PushKey = z.object({ key: z.string().nullable() });
const EmailResult = z.object({ ok: z.boolean(), email: z.string().nullable() });
const WhatsappResult = z.object({ ok: z.boolean(), whatsapp: z.string().nullable() });

// ─── Typed client ───
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** FastAPI errors are `{detail: string}` from AppErrors, but body-validation 422s
 *  return `{detail: [{msg,...}]}` — flatten both to a single human string. */
function detailFrom(raw: unknown, fallback: string): string {
  if (raw && typeof raw === "object" && "detail" in raw) {
    const d = (raw as { detail: unknown }).detail;
    if (typeof d === "string" && d) return d;
    if (Array.isArray(d)) {
      const msgs = d
        .map((e) => (e && typeof e === "object" && "msg" in e ? String((e as { msg: unknown }).msg) : ""))
        .filter(Boolean);
      if (msgs.length) return msgs.join(", ");
    }
  }
  return fallback;
}

async function parse<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, detailFrom(raw, res.statusText));
  return schema.parse(raw);
}

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  return parse(res, schema);
}

/** Multipart — never set Content-Type (the browser sets the boundary). */
async function requestForm<T>(path: string, schema: z.ZodType<T>, body: FormData): Promise<T> {
  const res = await fetch(`/api${path}`, { method: "POST", credentials: "include", body });
  return parse(res, schema);
}

type Credentials = { username: string; password: string; email?: string | null; whatsapp?: string | null };
type ComplaintBody = { accusedId: number; ruleId?: number; amount?: number; note?: string; images: File[] };
type BillBody = { type: BillType; total: number; month: string; paidBy?: number | null };
type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };

export const api = {
  // auth
  authMe: () => request("/auth/me", AuthMe),
  register: (body: Credentials) =>
    request("/auth/register", AuthResult, { method: "POST", body: JSON.stringify(body) }),
  login: (body: Pick<Credentials, "username" | "password">) =>
    request("/auth/login", AuthResult, { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/auth/logout", Ok, { method: "POST" }),

  // read surfaces
  me: () => request("/me", MeResponse),
  dashboard: () => request("/dashboard", DashboardResponse),
  spot: (spot: string) => request(`/spots/${spot}`, SpotResponse),
  publicStats: () => request("/public/stats", PublicStats),

  // complaints (the core loop)
  createComplaint: (body: ComplaintBody) => {
    const fd = new FormData();
    fd.append("accusedId", String(body.accusedId));
    if (body.ruleId != null) fd.append("ruleId", String(body.ruleId));
    if (body.amount != null) fd.append("amount", String(body.amount));
    if (body.note) fd.append("note", body.note);
    for (const img of body.images) fd.append("images", img);
    return requestForm("/complaints", ComplaintCreated, fd);
  },
  complaint: (id: number) => request(`/complaints/${id}`, ComplaintDetail),
  accept: (id: number) => request(`/complaints/${id}/accept`, AcceptResult, { method: "POST" }),
  dispute: (id: number, reason?: string) =>
    request(`/complaints/${id}/dispute`, DisputeResult, { method: "POST", body: JSON.stringify({ reason }) }),
  vote: (id: number, vote: Vote) =>
    request(`/complaints/${id}/vote`, VoteResult, { method: "POST", body: JSON.stringify({ vote }) }),

  // pay (read-only)
  pay: () => request("/pay", PayResponse),
  payFine: (id: number) => request(`/pay/${id}`, PayFineResult, { method: "POST" }),

  // bills (tenant)
  createBill: (body: BillBody) =>
    request("/bills", BillCreated, { method: "POST", body: JSON.stringify(body) }),
  markSharePaid: (billId: number, memberId: number) =>
    request(`/bills/${billId}/shares/${memberId}/paid`, Ok, { method: "POST" }),

  // notifications
  notifications: (unread = false) =>
    request(`/notifications?unread=${unread}`, NotificationsResponse),
  markNotificationRead: (id: number) =>
    request(`/notifications/${id}/read`, z.object({ ok: z.boolean(), changed: z.boolean() }), { method: "POST" }),
  markAllNotificationsRead: () =>
    request("/notifications/read-all", z.object({ ok: z.boolean(), marked: z.number() }), { method: "POST" }),

  // account & web push
  setEmail: (email: string | null) =>
    request("/account/email", EmailResult, { method: "POST", body: JSON.stringify({ email }) }),
  setWhatsapp: (whatsapp: string | null) =>
    request("/account/whatsapp", WhatsappResult, { method: "POST", body: JSON.stringify({ whatsapp }) }),
  pushPublicKey: () => request("/push/public-key", PushKey),
  pushSubscribe: (sub: PushSub) =>
    request("/push/subscribe", Ok, { method: "POST", body: JSON.stringify(sub) }),
  pushUnsubscribe: (endpoint: string) =>
    request("/push/unsubscribe", Ok, { method: "POST", body: JSON.stringify({ endpoint }) }),
};
