"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { ApiError, type Invitation, type Role } from "@/lib/api";
import { useInviteMember, useInvites, useRevokeInvite } from "@/lib/queries";
import { RoleBadge } from "./role-badge";

function inviteUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/join/${token}`;
}

/** Tenant-only: mint a shareable invite link + manage pending invites. */
export function InvitePanel() {
  const invite = useInviteMember();
  const revoke = useRevokeInvite();
  const { data } = useInvites();

  const [role, setRole] = useState<Role>("guest");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [created, setCreated] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    setCopied(false);
    invite
      .mutateAsync({ role, email: email.trim() || null, name: name.trim() || null })
      .then((res) => {
        setCreated(res.invitation);
        setName("");
        setEmail("");
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't create the invite."));
  }

  function copyLink(token: string) {
    navigator.clipboard?.writeText(inviteUrl(token)).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => {},
    );
  }

  const pending = data?.invitations ?? [];

  return (
    <section className="glass space-y-4 rounded-2xl p-5">
      <div>
        <h2 className="text-base font-semibold">Invite someone</h2>
        <p className="mt-1 text-sm text-muted-foreground">Mint a one-time link. They pick a username &amp; password, and join at the role you set.</p>
      </div>

      {/* generated link */}
      {created?.token && (
        <div className="rounded-xl border border-acid/40 bg-primary/5 p-3">
          <p className="mb-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-acid">Invite link — copy &amp; share it now</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-card px-2.5 py-2 text-xs">{inviteUrl(created.token)}</code>
            <button
              type="button"
              onClick={() => copyLink(created.token!)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-1.5 text-[0.7rem] text-muted-foreground">The link isn&apos;t shown again — grab it now.</p>
        </div>
      )}

      {/* form */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {(["guest", "tenant"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              aria-pressed={role === r}
              className={
                "rounded-xl border py-2.5 text-sm font-semibold capitalize transition-colors " +
                (role === r ? "border-acid bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {r}
            </button>
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Name (optional)"
          className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          maxLength={254}
          placeholder="Email (optional)"
          className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={invite.isPending}
          className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground glow-acid disabled:opacity-50"
        >
          {invite.isPending ? "Creating…" : "Create invite link"}
        </button>
      </div>

      {/* pending invites */}
      {pending.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Pending invites</p>
          <ul className="space-y-2">
            {pending.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2">
                <RoleBadge role={inv.role} />
                <span className="min-w-0 flex-1 truncate text-sm">{inv.name ?? inv.email ?? "Awaiting someone"}</span>
                <button
                  type="button"
                  onClick={() => revoke.mutate(inv.id)}
                  disabled={revoke.isPending}
                  aria-label="Revoke invite"
                  className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
