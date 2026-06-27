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
  proposalId: z.number().nullable(),
  billId: z.number().nullable(),
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

export const UpiLinks = z.object({ any: z.string(), gpay: z.string(), phonepe: z.string(), paytm: z.string() });
export type UpiLinks = z.infer<typeof UpiLinks>;

// A payable UPI block, or { configured: false } when no pot VPA is set (backend degrades gracefully).
export const UpiBlock = z.discriminatedUnion("configured", [
  z.object({ configured: z.literal(false) }),
  z.object({
    configured: z.literal(true),
    payeeVpa: z.string(),
    payeeName: z.string(),
    amount: z.number().nullable(),
    currency: z.string(),
    note: z.string(),
    links: UpiLinks,
  }),
]);
export type UpiBlock = z.infer<typeof UpiBlock>;

export const UnpaidFine = z.object({
  id: z.number(),
  amount: z.number(),
  rule: z.string().nullable(),
  upi: UpiBlock,
});
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

// ─── Rule proposals + rule book (governance) ───
// Render off `phase` (the backend maps status→phase; "expired"→"rejected").
export const ProposalPhase = z.enum(["draft", "review", "voting", "passed", "rejected", "cancelled"]);
export type ProposalPhase = z.infer<typeof ProposalPhase>;

export const ProposalStatus = z.enum([
  "draft", "pending_review", "voting", "passed", "rejected", "expired", "cancelled",
]);
export type ProposalStatus = z.infer<typeof ProposalStatus>;

export const ProposalType = z.enum(["new_rule", "modify_rule", "delete_rule"]);
export type ProposalType = z.infer<typeof ProposalType>;

export const ProposalChoice = z.enum(["yes", "no", "abstain"]);
export type ProposalChoice = z.infer<typeof ProposalChoice>;

export const ProposalEventType = z.enum([
  "created", "submitted", "approved", "voting_opened", "vote_cast", "commented",
  "extended", "frozen", "voting_closed", "passed", "rejected", "expired", "cancelled", "merged",
]);
export type ProposalEventType = z.infer<typeof ProposalEventType>;

export const ProposalTally = z.object({ yes: z.number(), no: z.number(), abstain: z.number() });
export type ProposalTally = z.infer<typeof ProposalTally>;

/** Fields shared by the list summary and the full detail. */
const ProposalCore = z.object({
  id: z.number(),
  type: ProposalType,
  status: ProposalStatus,
  phase: ProposalPhase,
  title: z.string(),
  targetRuleId: z.number().nullable(),
  proposedCategory: z.string().nullable(),
  proposedText: z.string().nullable(),
  proposedAmount: z.number().nullable(),
  votingOpensAt: z.string().nullable(),
  votingClosesAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  resolutionDetail: z.string().nullable(),
  mergedRuleId: z.number().nullable(),
  frozen: z.boolean(),
  createdAt: z.string(),
  version: z.number(),
  proposer: Member.nullable().optional(), // key omitted by the API when the proposer is missing
});

export const ProposalSummary = ProposalCore.extend({ tally: ProposalTally });
export type ProposalSummary = z.infer<typeof ProposalSummary>;

export const ProposalComment = z.object({
  id: z.number(),
  author: z.string().nullable(),
  authorId: z.number(),
  parentId: z.number().nullable(),
  body: z.string().nullable(), // null when soft-deleted
  edited: z.boolean(),
  deleted: z.boolean(),
  ts: z.string(),
});
export type ProposalComment = z.infer<typeof ProposalComment>;

export const ProposalEvent = z.object({
  type: ProposalEventType,
  actor: z.string().nullable(),
  detail: z.string().nullable(),
  ts: z.string(),
});
export type ProposalEvent = z.infer<typeof ProposalEvent>;

export const ProposalVoteState = z.object({
  yes: z.number(),
  no: z.number(),
  abstain: z.number(),
  eligible: z.number(),
  myVote: ProposalChoice.nullable(),
});
export type ProposalVoteState = z.infer<typeof ProposalVoteState>;

export const ProposalDetail = ProposalCore.extend({
  body: z.string().nullable(),
  vote: ProposalVoteState,
  comments: z.array(ProposalComment),
  timeline: z.array(ProposalEvent),
  canVote: z.boolean(), // open voting AND viewer is a tenant
  canEdit: z.boolean(), // draft AND viewer is the proposer
  canAdmin: z.boolean(), // viewer is a tenant
});
export type ProposalDetail = z.infer<typeof ProposalDetail>;

export const VoteRow = z.object({
  choice: ProposalChoice,
  voter: z.string().nullable(),
  ts: z.string(),
});
export type VoteRow = z.infer<typeof VoteRow>;

export const RuleBookRule = z.object({
  id: z.number(),
  category: z.string(),
  text: z.string(),
  amount: z.number(),
  isFavorite: z.boolean(),
  severityTier: z.string().nullable(),
  isActive: z.boolean(),
  useCount: z.number(),
});
export type RuleBookRule = z.infer<typeof RuleBookRule>;

export const RuleVersion = z.object({
  id: z.number(),
  ruleId: z.number(),
  versionNumber: z.number(),
  category: z.string(),
  text: z.string(),
  amount: z.number(),
  isFavorite: z.boolean(),
  severityTier: z.string().nullable(),
  active: z.boolean(),
  createdBy: z.number().nullable(),
  approvedBy: z.number().nullable(),
  proposalId: z.number().nullable(),
  createdAt: z.string(),
});
export type RuleVersion = z.infer<typeof RuleVersion>;

// ─── Household user management ───
export const InvitationStatus = z.enum(["pending", "accepted", "revoked", "expired"]);
export type InvitationStatus = z.infer<typeof InvitationStatus>;

/** Management view of a member (roster + lifecycle; no private contacts). */
export const MemberAdmin = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string().nullable(),
  role: Role,
  isActive: z.boolean(),
  joinedOn: z.string(),
  leftOn: z.string().nullable(),
});
export type MemberAdmin = z.infer<typeof MemberAdmin>;

export const MemberEvent = z.object({
  type: z.string(),
  actorId: z.number().nullable(),
  detail: z.string().nullable(),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
  ts: z.string(),
});
export type MemberEvent = z.infer<typeof MemberEvent>;

export const Invitation = z.object({
  id: z.number(),
  role: Role,
  name: z.string().nullable(),
  email: z.string().nullable(),
  status: InvitationStatus,
  invitedBy: z.number(),
  createdAt: z.string(),
  expiresAt: z.string(),
  acceptedBy: z.number().nullable(),
  acceptedAt: z.string().nullable(),
  token: z.string().optional(), // only echoed to the inviter, right after creation
});
export type Invitation = z.infer<typeof Invitation>;

/** Public preview of a pending invite (the join page). */
export const InvitePreview = z.object({
  role: Role,
  name: z.string().nullable(),
  invitedBy: z.string().nullable(),
  expiresAt: z.string(),
});
export type InvitePreview = z.infer<typeof InvitePreview>;

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

export const BillStatus = z.enum(["pending", "confirmed", "disputed"]);
export type BillStatus = z.infer<typeof BillStatus>;

export const DashboardBill = z.object({
  id: z.number(),
  type: z.string(),
  total: z.number(),
  month: z.string(),
  status: BillStatus,
  claimedBy: z.string().nullable(),
  claimedById: z.number().nullable(),
  claimedAt: z.string(),
  confirmDeadline: z.string().nullable(),
  disputedBy: z.string().nullable(),
  disputeReason: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  canDispute: z.boolean(),
});
export type DashboardBill = z.infer<typeof DashboardBill>;

export const DashboardResponse = z.object({
  pot: z.number(),
  potCount: z.number(),
  dues: z.array(Due),
  recentFines: z.array(RecentComplaint),
  overturn: z.array(Overturn),
  bills: z.array(DashboardBill),
});
export type DashboardResponse = z.infer<typeof DashboardResponse>;

export const PayResponse = z.object({
  unpaid: z.array(UnpaidFine),
  total: z.number(),
  upi: UpiBlock,
  walletQr: z.string().nullable(),
});
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
  gettingHere: GettingHere, // public so visitors can get directions without an account
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

// governance wrappers
const ProposalsResponse = z.object({ proposals: z.array(ProposalSummary) });
const ProposalCreated = z.object({ ok: z.boolean(), proposalId: z.number() });
const ProposalStatusResult = z.object({ ok: z.boolean(), status: ProposalStatus });
const ProposalVoteResult = z.object({ ok: z.boolean(), tally: ProposalTally });
const ProposalVotesResponse = z.object({
  tally: z.object({ yes: z.number(), no: z.number(), abstain: z.number(), total: z.number().optional() }),
  votes: z.array(VoteRow),
});
const ProposalTimelineResponse = z.object({ timeline: z.array(ProposalEvent) });
const ProposalCommentsResponse = z.object({ comments: z.array(ProposalComment) });
const CommentCreated = z.object({ ok: z.boolean(), commentId: z.number() });
const RuleBookResponse = z.object({ rules: z.array(RuleBookRule) });
const RuleVersionsResponse = z.object({ versions: z.array(RuleVersion) });
const RollbackResult = z.object({ ok: z.boolean(), version: RuleVersion });

// household wrappers
const MembersResponse = z.object({ members: z.array(MemberAdmin) });
const MemberDetailResponse = z.object({ member: MemberAdmin, events: z.array(MemberEvent).optional() });
const MemberActionResult = z.object({ ok: z.boolean(), member: MemberAdmin });
const InvitationsResponse = z.object({ invitations: z.array(Invitation) });
const InviteCreated = z.object({ ok: z.boolean(), invitation: Invitation });
const RevokeResult = z.object({ ok: z.boolean(), invitation: Invitation });

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

type Credentials = { username: string; password: string; email?: string | null; whatsapp?: string | null; invite?: string | null };
type ComplaintBody = { accusedId: number; ruleId?: number; amount?: number; note?: string; images: File[] };
type BillBody = { type: BillType; total: number; month: string };
type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };
type ProposalCreateBody = {
  type: ProposalType;
  title: string;
  body?: string | null;
  targetRuleId?: number | null;
  proposedCategory?: string | null;
  proposedText?: string | null;
  proposedAmount?: number | null;
  submit?: boolean;
};
type ProposalUpdateBody = {
  title?: string;
  body?: string | null;
  proposedCategory?: string | null;
  proposedText?: string | null;
  proposedAmount?: number | null;
  expectedVersion?: number;
};

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
  disputeBill: (billId: number, reason?: string) =>
    request(`/bills/${billId}/dispute`, Ok, { method: "POST", body: JSON.stringify({ reason }) }),
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
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request("/account/password", Ok, { method: "POST", body: JSON.stringify(body) }),
  pushPublicKey: () => request("/push/public-key", PushKey),
  pushSubscribe: (sub: PushSub) =>
    request("/push/subscribe", Ok, { method: "POST", body: JSON.stringify(sub) }),
  pushUnsubscribe: (endpoint: string) =>
    request("/push/unsubscribe", Ok, { method: "POST", body: JSON.stringify({ endpoint }) }),

  // governance — proposals (session cookie; voting is tenant-only, gated server-side)
  listProposals: (status?: string) =>
    request(`/proposals${status ? `?status=${encodeURIComponent(status)}` : ""}`, ProposalsResponse),
  proposal: (id: number) => request(`/proposals/${id}`, ProposalDetail),
  createProposal: (body: ProposalCreateBody) =>
    request("/proposals", ProposalCreated, { method: "POST", body: JSON.stringify(body) }),
  updateProposal: (id: number, body: ProposalUpdateBody) =>
    request(`/proposals/${id}`, Ok, { method: "PATCH", body: JSON.stringify(body) }),
  submitProposal: (id: number) =>
    request(`/proposals/${id}/submit`, ProposalStatusResult, { method: "POST" }),
  voteProposal: (id: number, vote: ProposalChoice) =>
    request(`/proposals/${id}/vote`, ProposalVoteResult, { method: "POST", body: JSON.stringify({ vote }) }),
  proposalVotes: (id: number) => request(`/proposals/${id}/votes`, ProposalVotesResponse),
  proposalTimeline: (id: number) => request(`/proposals/${id}/timeline`, ProposalTimelineResponse),
  proposalComments: (id: number) => request(`/proposals/${id}/comments`, ProposalCommentsResponse),
  addProposalComment: (id: number, body: string, parentId?: number | null) =>
    request(`/proposals/${id}/comments`, CommentCreated, {
      method: "POST",
      body: JSON.stringify({ body, parentId: parentId ?? null }),
    }),
  editProposalComment: (id: number, commentId: number, body: string) =>
    request(`/proposals/${id}/comments/${commentId}`, Ok, { method: "PATCH", body: JSON.stringify({ body }) }),
  deleteProposalComment: (id: number, commentId: number) =>
    request(`/proposals/${id}/comments/${commentId}`, Ok, { method: "DELETE" }),
  cancelProposal: (id: number) => request(`/proposals/${id}/cancel`, ProposalStatusResult, { method: "POST" }),
  // admin (tenant) controls
  approveProposal: (id: number) => request(`/proposals/${id}/approve`, ProposalStatusResult, { method: "POST" }),
  rejectProposal: (id: number) => request(`/proposals/${id}/reject`, ProposalStatusResult, { method: "POST" }),
  extendProposal: (id: number, hours: number) =>
    request(`/proposals/${id}/extend`, Ok, { method: "POST", body: JSON.stringify({ hours }) }),
  freezeProposal: (id: number, frozen: boolean) =>
    request(`/proposals/${id}/freeze`, Ok, { method: "POST", body: JSON.stringify({ frozen }) }),
  forceMergeProposal: (id: number) =>
    request(`/proposals/${id}/force-merge`, ProposalStatusResult, { method: "POST" }),

  // governance — rule book
  rulebook: () => request("/rulebook", RuleBookResponse),
  ruleVersions: (ruleId: number) => request(`/rulebook/${ruleId}/versions`, RuleVersionsResponse),
  rollbackRule: (ruleId: number, versionId: number) =>
    request(`/rulebook/${ruleId}/rollback/${versionId}`, RollbackResult, { method: "POST" }),

  // household user management (manage controls are gated server-side by permission)
  listMembers: (includeInactive = false) =>
    request(`/household/members${includeInactive ? "?includeInactive=true" : ""}`, MembersResponse),
  getMember: (id: number) => request(`/household/members/${id}`, MemberDetailResponse),
  renameMember: (id: number, name: string) =>
    request(`/household/members/${id}`, MemberActionResult, { method: "PATCH", body: JSON.stringify({ name }) }),
  setMemberRole: (id: number, role: Role) =>
    request(`/household/members/${id}/role`, MemberActionResult, { method: "POST", body: JSON.stringify({ role }) }),
  removeMember: (id: number) =>
    request(`/household/members/${id}`, MemberActionResult, { method: "DELETE" }),
  inviteMember: (body: { role: Role; email?: string | null; name?: string | null }) =>
    request("/household/members/invite", InviteCreated, { method: "POST", body: JSON.stringify(body) }),
  listInvites: () => request("/household/invites", InvitationsResponse),
  revokeInvite: (id: number) =>
    request(`/household/invites/${id}/revoke`, RevokeResult, { method: "POST" }),
  previewInvite: (token: string) =>
    request(`/household/invites/${encodeURIComponent(token)}`, InvitePreview),
};
