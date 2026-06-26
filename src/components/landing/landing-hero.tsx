"use client";

import { Fragment, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, usePublicStats } from "@/lib/queries";
import { SettleGame } from "./settle-game";

const FALLBACK_SHAME = [
  { name: "Amit", fines: 3, total: 120 },
  { name: "Priya", fines: 3, total: 110 },
  { name: "Zoe", fines: 2, total: 100 },
];

const inr = (n: number) => n.toLocaleString("en-IN");

/* Custom icons emoji can't do: a real-looking Kingfisher can, a cannabis leaf, a DualSense. */
function BeerIcon() {
  return (
    <svg viewBox="0 0 24 36" aria-hidden>
      <rect x="3" y="4" width="18" height="30" rx="3" fill="#d2122e" />
      <rect x="6" y="4" width="2.4" height="30" fill="#ff5b6e" opacity="0.5" />
      <rect x="16.6" y="4" width="2" height="30" fill="#9e0c1f" opacity="0.6" />
      <rect x="3" y="14.5" width="18" height="10.5" fill="#f7f3ea" />
      <rect x="3" y="14.5" width="18" height="1.5" fill="#e2b84a" />
      <rect x="3" y="23.5" width="18" height="1.5" fill="#e2b84a" />
      <path d="M8.4 20.4 Q11 17.6 12 19.6 Q13 17.6 15.6 20.4" stroke="#d2122e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <ellipse cx="12" cy="4" rx="9" ry="2.6" fill="#dfe4e7" />
      <ellipse cx="12" cy="3.5" rx="6.4" ry="1.5" fill="#b3bbc0" />
      <ellipse cx="13" cy="3.4" rx="2.3" ry="1" fill="none" stroke="#8f969b" strokeWidth="0.7" />
    </svg>
  );
}
function LeafIcon() {
  const leaf = (d: string, r: number) => <path d={d} transform={`rotate(${r} 16 30)`} />;
  const long = "M16 30 C13 19 13 8 16 2 C19 8 19 19 16 30Z";
  const med = "M16 30 C14 22 14 13 16 8 C18 13 18 22 16 30Z";
  const short = "M16 30 C14.5 25 14.5 18 16 14 C17.5 18 17.5 25 16 30Z";
  return (
    <svg viewBox="0 0 32 34" aria-hidden>
      <g fill="#4f8a4a" stroke="#3c6b39" strokeWidth="0.5" strokeLinejoin="round">
        <path d={long} />
        {leaf(long, 30)}
        {leaf(long, -30)}
        {leaf(med, 58)}
        {leaf(med, -58)}
        {leaf(short, 84)}
        {leaf(short, -84)}
      </g>
      <line x1="16" y1="30" x2="16" y2="33" stroke="#3c6b39" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function PadIcon() {
  return (
    <svg viewBox="0 0 40 30" aria-hidden>
      <path
        d="M13 6 C17 4 23 4 27 6 C32 7 38.5 8 39 16 C39.4 23 35 28.5 30 27 C26 25.8 24.5 21 23 19.4 C21.4 18.4 18.6 18.4 17 19.4 C15.5 21 14 25.8 10 27 C5 28.5 0.6 23 1 16 C1.5 8 8 7 13 6 Z"
        fill="#edeef0"
        stroke="#181711"
        strokeWidth="1.1"
      />
      <rect x="16" y="8.5" width="8" height="7" rx="1.6" fill="#f8f9fa" stroke="#c9ccce" strokeWidth="0.6" />
      <g fill="#2a2820">
        <rect x="7.6" y="11.4" width="5" height="1.7" rx="0.5" />
        <rect x="9.25" y="9.75" width="1.7" height="5" rx="0.5" />
      </g>
      <circle cx="30" cy="9.6" r="1" fill="#3aa06a" />
      <circle cx="32.4" cy="12" r="1" fill="#d24b6a" />
      <circle cx="30" cy="14.4" r="1" fill="#5a9aa0" />
      <circle cx="27.6" cy="12" r="1" fill="#d29bb0" />
      <circle cx="15.5" cy="18.6" r="2.7" fill="#2a2820" />
      <circle cx="15.5" cy="18.6" r="1.3" fill="#5c5749" />
      <circle cx="24.5" cy="18.6" r="2.7" fill="#2a2820" />
      <circle cx="24.5" cy="18.6" r="1.3" fill="#5c5749" />
    </svg>
  );
}

export function LandingHero() {
  const router = useRouter();
  const member = useAuth().data?.member ?? null;
  const { data } = usePublicStats();

  // Authed visitors are routed to their home by role (brief §6).
  useEffect(() => {
    if (member) router.replace(member.role === "tenant" ? "/dashboard" : "/hive");
  }, [member, router]);

  const pot = data?.pot ?? 4250;
  const potCount = data?.potCount ?? 37;
  const shame = data?.hallOfShame.length ? data.hallOfShame : FALLBACK_SHAME;
  const flatmates = shame.length || 4;
  const ticker = shame.slice(0, 6).map((s) => ({
    who: s.name,
    what: `${s.fines} ${s.fines === 1 ? "fine" : "fines"}`,
    amt: `₹${inr(s.total)}`,
  }));

  return (
    <main className="landing">
      <div className="lh-glow" aria-hidden />

      <header className="lh-head">
        <div className="lh-brand">
          <svg viewBox="0 0 30 30" aria-hidden>
            <polygon points="15,2 26,8.5 26,21.5 15,28 4,21.5 4,8.5" fill="none" stroke="#181711" strokeWidth="1.7" />
            <polygon points="15,8 21,11.5 21,18.5 15,22 9,18.5 9,11.5" fill="rgb(156 206 30)" />
          </svg>
          <span>hive</span>
        </div>
        <nav className="lh-nav">
          <Link href="/login" className="login">
            Log in
          </Link>
          <Link href="/register" className="join">
            Join
          </Link>
        </nav>
      </header>

      <div className="stage">
        <span className="eyebrow">
          <span className="pdot">
            <i />
            <i />
          </span>{" "}
          The flat that keeps score
        </span>

        <div className="logo" role="img" aria-label="hive">
          <span className="dots" aria-hidden>
            <i className="a" />
            <i className="b" />
            <i className="c" />
            <i className="d" />
          </span>
          <span className="word" aria-hidden>
            <span className="ltr l1">h</span>
            <span className="ltr l2 i-wrap">
              {"ı"}
              <b className="tittle" />
            </span>
            <span className="ltr l3">v</span>
            <span className="ltr l4">e</span>
          </span>
        </div>

        <div className="title-wrap">
          <div className="icons" aria-hidden>
            <span className="ico i1">🍕</span>
            <span className="ico i2">
              <BeerIcon />
            </span>
            <span className="ico i3">🥃</span>
            <span className="ico i4">
              <LeafIcon />
            </span>
            <span className="ico i5">
              <PadIcon />
            </span>
            <span className="ico i6">🎧</span>
          </div>
          <h1 className="title">
            Four flatmates. One <b>pot.</b>
          </h1>
        </div>

        <p className="sub">
          House rules, fines, and a shared cash jar — the bot is the ledger, the wallet is the jar.
        </p>
        <div className="lh-ctas">
          <Link href="/register" className="lh-btn primary">
            Enter the Hive →
          </Link>
          <Link href="/login" className="lh-btn ghost">
            See the damage
          </Link>
        </div>
        <div className="lh-stats">
          <span>
            <b>₹{inr(pot)}</b> in the jar
          </span>
          <span className="sep">·</span>
          <span>
            <b>{potCount}</b> confirmed fines
          </span>
          <span className="sep">·</span>
          <span>
            <b>{flatmates}</b> flatmates
          </span>
        </div>
      </div>

      <SettleGame />

      <div className="ticker" aria-hidden>
        <div className="ticker-track">
          {[...ticker, ...ticker].map((t, i) => (
            <Fragment key={i}>
              <span className="ti">
                <b>{t.who}</b> · {t.what} <span className="amt">{t.amt}</span>
              </span>
              <span className="tdot" />
            </Fragment>
          ))}
        </div>
      </div>
    </main>
  );
}
