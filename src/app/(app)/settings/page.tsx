"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Download, LogOut, Mail, MessageCircle, Share, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  useLogout,
  useMe,
  usePushPublicKey,
  useSetEmail,
  useSetWhatsapp,
} from "@/lib/queries";
import { usePwaInstall } from "@/lib/use-pwa";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function Card({ children }: { children: React.ReactNode }) {
  return <section className="glass rounded-2xl p-5">{children}</section>;
}

const fieldCls =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

function urlB64ToUint8(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: me, isPending } = useMe();
  const setEmail = useSetEmail();
  const setWhatsapp = useSetWhatsapp();
  const logout = useLogout();
  const pushKey = usePushPublicKey();
  const pwa = usePwaInstall();

  const [email, setEmailV] = useState("");
  const [whatsapp, setWhatsappV] = useState("");
  const [contactMsg, setContactMsg] = useState<string | null>(null);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  useEffect(() => {
    if (me) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seed the form from async-loaded contact details
      setEmailV(me.member.email ?? "");
      setWhatsappV(me.member.whatsapp ?? "");
    }
  }, [me]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushOn(!!sub))
      .catch(() => {});
  }, []);

  if (isPending || !me) {
    return (
      <main className="mx-auto max-w-xl space-y-4 px-5 py-8">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </main>
    );
  }

  function saveContacts() {
    setContactMsg(null);
    const e = email.trim();
    const w = whatsapp.trim();
    Promise.all([
      setEmail.mutateAsync(e || null),
      setWhatsapp.mutateAsync(w || null),
    ])
      .then(() => setContactMsg("Saved ✅"))
      .catch((err) => setContactMsg(err instanceof ApiError ? err.message : "Couldn't save."));
  }

  async function togglePush(next: boolean) {
    setPushMsg(null);
    setPushBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (next) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") throw new Error("Notifications are blocked in your browser.");
        const key = pushKey.data?.key;
        if (!key) throw new Error("Push isn't configured.");
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8(key),
        });
        const j = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
        await api.pushSubscribe({
          endpoint: j.endpoint ?? "",
          keys: { p256dh: j.keys?.p256dh ?? "", auth: j.keys?.auth ?? "" },
        });
        setPushOn(true);
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await api.pushUnsubscribe(sub.endpoint).catch(() => {});
          await sub.unsubscribe();
        }
        setPushOn(false);
      }
    } catch (err) {
      setPushMsg(err instanceof Error ? err.message : "Couldn't update push.");
    } finally {
      setPushBusy(false);
    }
  }

  const pushConfigured = pushKey.data?.key != null;
  const contactSaving = setEmail.isPending || setWhatsapp.isPending;

  return (
    <main className="mx-auto max-w-xl space-y-5 px-5 py-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">⚙️ You</h1>
        <p className="mt-1 text-sm text-muted-foreground">Signed in as {me.member.name}.</p>
      </header>

      <Link
        href="/household"
        className="glass group flex items-center gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-acid">
          <Users className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Household</span>
          <span className="block text-sm text-muted-foreground">
            {me.member.role === "tenant" ? "Manage members, roles & invites." : "See who's in the flat."}
          </span>
        </span>
        <span aria-hidden className="text-xl text-muted-foreground transition-transform group-hover:translate-x-1">→</span>
      </Link>

      <Card>
        <h2 className="text-base font-semibold">Get notified</h2>
        <p className="mt-1 text-sm text-muted-foreground">So Hive can ping you the moment you&apos;re accused.</p>
        <label className="mt-4 block">
          <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            <Mail className="size-3.5" /> Email
          </span>
          <input type="email" value={email} onChange={(e) => setEmailV(e.target.value)} placeholder="you@flat.com" className={fieldCls} />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            <MessageCircle className="size-3.5" /> WhatsApp
          </span>
          <input type="tel" value={whatsapp} onChange={(e) => setWhatsappV(e.target.value)} placeholder="+91…" className={fieldCls} />
        </label>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveContacts}
            disabled={contactSaving}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {contactSaving ? "Saving…" : "Save"}
          </button>
          {contactMsg && <span className="text-sm text-muted-foreground">{contactMsg}</span>}
        </div>
      </Card>

      {pushConfigured && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Bell className="size-4" /> Push notifications
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Real-time alerts on this device.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pushOn}
              disabled={pushBusy}
              onClick={() => togglePush(!pushOn)}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50",
                pushOn ? "bg-primary" : "bg-muted",
              )}
            >
              <span className={cn("absolute top-1 size-5 rounded-full bg-card shadow transition-all", pushOn ? "left-6" : "left-1")} />
            </button>
          </div>
          {pushMsg && <p className="mt-3 text-sm text-destructive">{pushMsg}</p>}
        </Card>
      )}

      {!pwa.isStandalone && (
        <Card>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Download className="size-4" /> Install Hive
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add it to your home screen — needed for push on iOS.
          </p>
          {pwa.canInstall ? (
            <button
              type="button"
              onClick={pwa.promptInstall}
              className="mt-4 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"
            >
              Add to home screen
            </button>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              {pwa.isIOS ? (
                <>
                  Tap <Share className="inline size-4" /> then “Add to Home Screen”.
                </>
              ) : (
                "Use your browser menu → Install / Add to Home screen."
              )}
            </p>
          )}
        </Card>
      )}

      <button
        type="button"
        onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace("/login") })}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 font-medium text-muted-foreground transition-colors hover:text-destructive"
      >
        <LogOut className="size-4" /> Log out
      </button>
    </main>
  );
}
