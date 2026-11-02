<div align="center">

# Hive

**The flat that keeps score.**

A mobile-first web app for shared flats: house rules, fines backed by photo proof,
flat votes on disputes, shared expenses, rent and settle-up.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)

**[Live app](https://hive-flat.duckdns.org)** · [Backend](https://github.com/vijayfagaria-dev/hive-api) · [Features](#features) · [Getting started](#getting-started)

</div>

<br>

| Landing | Dashboard | Shared expenses |
|---|---|---|
| ![Landing](docs/screenshots/landing.jpg) | ![Dashboard](docs/screenshots/dashboard.jpg) | ![Expenses](docs/screenshots/expenses.jpg) |

| Flat vote on a dispute | Rule change proposal | Sign-up verification |
|---|---|---|
| ![Complaint vote](docs/screenshots/complaint-vote.jpg) | ![Rule proposal](docs/screenshots/proposal.jpg) | ![Sign-up code](docs/screenshots/otp.jpg) |

## About

Hive gives a shared flat one place for everything that usually lives in group chats and
memory: the house rules, who broke them, who paid for what, and who owes whom. It is built
for phones first and installs to the home screen like a native app.

This repository is the web client. The API lives in
[hive-api](https://github.com/vijayfagaria-dev/hive-api).

## Features

- **Complaints with evidence:** report a rule break with a photo; disputes go to a flat vote
  with a live tally and countdown.
- **Expenses and settle-up:** split costs any way you like, track rent by tenant share, and
  settle the flat in the fewest payments.
- **UPI payments:** pay with one tap or a QR code from your own banking app.
- **Governance:** propose and vote on rule changes, with a versioned rule book.
- **Household:** invite flatmates, manage roles, and give guests a lighter view.
- **Notifications:** push on Android and iPhone, plus email and WhatsApp.
- **NFC stickers:** tap a sticker in the kitchen or on the balcony to see that spot's rules.

## Getting started

Requires Node.js 20+ and the [Hive API](https://github.com/vijayfagaria-dev/hive-api)
running locally.

```bash
git clone https://github.com/vijayfagaria-dev/hive-web.git
cd hive-web
npm install
npm run dev
```

Open `http://localhost:3000`. Requests to `/api` are forwarded to the backend on port 8000.

## Built with

- **Next.js 16** (App Router) and **React 19**, written in strict **TypeScript**
- **TanStack Query** for server state and **Zod** for a runtime-validated API contract
- **Tailwind CSS v4** with **shadcn/ui** on Base UI, and **Motion** for animation
- Installable **PWA** with Web Push
