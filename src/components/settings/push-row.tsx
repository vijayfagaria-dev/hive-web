"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SettingsRow } from "./settings-list";

function urlB64ToUint8(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Web Push on this device, as a switch row. Errors show under the row. */
export function PushRow({ vapidKey }: { vapidKey: string }) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setOn(!!sub))
      .catch(() => {});
  }, []);

  async function toggle(next: boolean) {
    setError(null);
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (next) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") throw new Error("Notifications are blocked in your browser settings.");
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(vapidKey) });
        const j = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
        await api.pushSubscribe({ endpoint: j.endpoint ?? "", keys: { p256dh: j.keys?.p256dh ?? "", auth: j.keys?.auth ?? "" } });
        setOn(true);
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await api.pushUnsubscribe(sub.endpoint).catch(() => {});
          await sub.unsubscribe();
        }
        setOn(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SettingsRow
        icon={Bell}
        label="Push notifications"
        value={on ? "On" : "Off"}
        trailing={
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Push notifications"
            disabled={busy}
            onClick={() => toggle(!on)}
            className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50", on ? "bg-primary" : "bg-muted")}
          >
            <span className={cn("absolute top-1 size-5 rounded-full bg-card shadow transition-all", on ? "left-6" : "left-1")} />
          </button>
        }
      />
      {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}
