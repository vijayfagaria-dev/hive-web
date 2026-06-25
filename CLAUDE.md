# CLAUDE.md — Hive Web (frontend)

Guidance for Claude Code working in the **hive-web** repo.

## What this is

The **web frontend** for **Hive** — a *personal hobby project* that runs a shared 4–6
person flat (house rules, fines, a common "pot," four recurring bills, dues, a guest
experience, and NFC stickers). A Next.js 16 app that consumes the backend's JSON API.
**Independent from any work/corporate project** — do not import its conventions or code.

The **backend (API + Telegram bot) is a separate repo** → [vijayfagaria-dev/hive-api](https://github.com/vijayfagaria-dev/hive-api).
The dev server proxies `/api` → that backend, so auth stays same-origin (no CORS).

**Read `DESIGN.md`** for the whole product design (the single source of truth). Keep the
Zod schemas in `src/lib/api.ts` in sync with the backend — they are the runtime contract.

@AGENTS.md
