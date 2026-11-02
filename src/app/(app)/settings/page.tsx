"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CircleAlert, KeyRound, LogOut, Mail, MessageCircle, MonitorSmartphone, Users } from "lucide-react";
import { useLogout, useLogoutAll, useMe, usePushPublicKey } from "@/lib/queries";
import { Avatar } from "@/components/app/avatar";
import { RoleBadge } from "@/components/household/role-badge";
import { EmailSheet } from "@/components/settings/email-sheet";
import { InstallRow } from "@/components/settings/install-row";
import { PasswordSheet } from "@/components/settings/password-sheet";
import { formatPhone } from "@/components/settings/phone-field";
import { PushRow } from "@/components/settings/push-row";
import { SettingsGroup, SettingsRow } from "@/components/settings/settings-list";
import { WhatsappSheet } from "@/components/settings/whatsapp-sheet";
import { Skeleton } from "@/components/ui/skeleton";

type Panel = "email" | "whatsapp" | "password" | null;

export default function SettingsPage() {
  const router = useRouter();
  const { data: me, isPending } = useMe();
  const logout = useLogout();
  const logoutAll = useLogoutAll();
  const vapidKey = usePushPublicKey().data?.key ?? null;
  const [panel, setPanel] = useState<Panel>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  if (isPending || !me) {
    return (
      <main className="mx-auto max-w-xl space-y-5 px-5 py-8">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </main>
    );
  }

  const m = me.member;
  const email = m.email ?? "";

  function logoutEverywhere() {
    if (!window.confirm("Sign out of Hive on every device, including this one?")) return;
    logoutAll.mutate(undefined, { onSuccess: () => router.replace("/login") });
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 px-5 py-8">
      <header className="flex items-center gap-4">
        <Avatar name={m.name} className="size-16 text-xl" />
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-bold tracking-tight">{m.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {m.username && <span>@{m.username}</span>}
            <RoleBadge role={m.role} />
          </div>
        </div>
      </header>

      <p aria-live="polite" className={notice ? "rounded-xl bg-primary/15 px-4 py-2.5 text-sm font-medium" : "sr-only"}>
        {notice ? `✓ ${notice}` : ""}
      </p>

      <SettingsGroup title="Account">
        <SettingsRow
          icon={Mail}
          label="Email"
          onClick={() => setPanel("email")}
          value={
            email ? (
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate">{email}</span>
                {m.emailVerified ? (
                  <BadgeCheck aria-label="Verified" className="size-4 shrink-0 text-acid" />
                ) : (
                  <CircleAlert aria-label="Not verified" className="size-4 shrink-0 text-chart-4" />
                )}
              </span>
            ) : (
              "Add email"
            )
          }
        />
        <SettingsRow
          icon={MessageCircle}
          label="WhatsApp"
          value={formatPhone(m.whatsapp) || "Add number"}
          onClick={() => setPanel("whatsapp")}
        />
        <SettingsRow icon={KeyRound} label="Password" value="Change" onClick={() => setPanel("password")} />
      </SettingsGroup>

      {email && !m.emailVerified && (
        <p className="-mt-3 px-1 text-xs text-muted-foreground">
          Verify your email so password resets reach you — tap <b className="text-foreground">Email</b>.
        </p>
      )}

      <SettingsGroup title="Notifications">
        {vapidKey && <PushRow vapidKey={vapidKey} />}
        <InstallRow />
      </SettingsGroup>

      <SettingsGroup title="Flat">
        <SettingsRow
          icon={Users}
          label="Household"
          value={m.role === "tenant" ? "Members & invites" : "Who's in the flat"}
          href="/household"
        />
      </SettingsGroup>

      <SettingsGroup title="Sign out">
        <SettingsRow
          icon={LogOut}
          label="Log out"
          destructive
          disabled={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace("/login") })}
        />
        <SettingsRow
          icon={MonitorSmartphone}
          label="Log out of all devices"
          destructive
          disabled={logoutAll.isPending}
          onClick={logoutEverywhere}
        />
      </SettingsGroup>

      {panel === "email" && (
        <EmailSheet open current={email} verified={m.emailVerified} onClose={() => setPanel(null)} onDone={setNotice} />
      )}
      {panel === "whatsapp" && <WhatsappSheet open current={m.whatsapp} onClose={() => setPanel(null)} onDone={setNotice} />}
      {panel === "password" && (
        <PasswordSheet open username={m.username ?? undefined} onClose={() => setPanel(null)} onDone={setNotice} />
      )}
    </main>
  );
}
