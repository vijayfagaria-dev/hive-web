# START HERE — kickoff prompt for Claude (hive-web)

Paste the block below into a fresh Claude Code session opened in the **hive-web**
repo. It points Claude at the brief, tells it when to read the backend, and gives
it design authority.

---

```
You are implementing the Hive web frontend in this repo (hive-web): a mobile-first,
installable PWA for a 4–6 person shared flat (house rules → photo-proof complaints →
accept/deny → flat vote → a shared fine "pot", plus bills, dues, pay, Hall of Shame,
NFC spot pages, and notifications).

START BY READING, IN THIS ORDER:
1. FRONTEND_BRIEF.md  — the primary spec: product, the full /api contract (with Zod/TS
   types), the complaint workflow rules, the routes/screens, components, popups/sheets,
   notification integration, the gen-z design language, edge cases, and the milestone
   build order. Build to this.
2. DESIGN.md, CLAUDE.md, AGENTS.md — product intent + this repo's house rules.
3. The existing scaffolding you must EXTEND (do not reinvent): src/lib/api.ts (the typed
   client + Zod contract — keep it in sync with the backend), src/lib/queries.ts (TanStack
   hooks), src/lib/motion.ts, src/app/providers.tsx, next.config.ts, and the partially-built
   routes under src/app/(auth), src/app/(app), src/app/s/[spot] and src/components/*.

WHEN ANYTHING IS UNCLEAR, READ THE BACKEND — don't guess.
It's the sibling repo at ../hive-api. For exact field names, status codes, and rules, read:
  ../hive-api/app/api/routes/*.py      (every endpoint, its auth, request, response)
  ../hive-api/app/schemas/*.py         (exact JSON field names — the response mappers)
  ../hive-api/app/domain/enums.py      (statuses, phases, vote values, bill types)
  ../hive-api/app/services/complaints.py (the accept/deny/vote/cooling/finalize state machine)
  ../hive-api/app/services/notifications.py, app/domain/nfc.py
If the brief and the backend code ever disagree, the CODE WINS — and tell me about the drift.

YOU HAVE DESIGN AUTHORITY.
Decide and design the screens, modules, popups/bottom-sheets, navigation, motion, and the
gen-z visual language yourself. Make confident, polished, cohesive choices — don't stop to
ask about colors, copy, or layout. Only ask me if a real product decision is genuinely
ambiguous AND not answerable from the code.

CONSTRAINTS:
- Preserve the API contract exactly; never invent endpoints. Same-origin cookie auth via the
  existing /api proxy; always send credentials; treat 401 as logged-out.
- Mobile-first, installable PWA with Web Push (service worker); email/WhatsApp are captured in
  Settings and delivered server-side.
- Every server response goes through a Zod schema in src/lib/api.ts. Handle every loading /
  empty / error state. Keep components small, typed, and accessible (respect reduced-motion).
- Work in the brief's milestone order (§16). Build incrementally and show me progress between
  milestones rather than dumping everything at once.

HOW TO RUN / VERIFY:
- Run the backend (../hive-api: `uvicorn app.main:app --reload`, it serves :8000) and this
  app (`npm run dev`, which proxies /api → :8000). Use Playwright for screenshots to check
  your work on a phone-sized viewport.

First: read FRONTEND_BRIEF.md + the existing src/lib files, then give me a short plan for
Milestone 1 (foundation: typed client/auth/role routing/app shell + bottom nav) and start.
```

---

*The brief itself is `FRONTEND_BRIEF.md` in this repo (copied from the backend, tailored to
this scaffolding). It already tells Claude to read `../hive-api` when in doubt.*
