"use client";

import { useState } from "react";
import { Download, Share } from "lucide-react";
import { usePwaInstall } from "@/lib/use-pwa";
import { Sheet } from "@/components/app/sheet";
import { SettingsRow } from "./settings-list";

/** "Install Hive" — the native prompt where the browser has one, else a how-to sheet. */
export function InstallRow() {
  const pwa = usePwaInstall();
  const [guide, setGuide] = useState(false);
  if (pwa.isStandalone) return null;

  return (
    <>
      <SettingsRow
        icon={Download}
        label="Install Hive"
        value={pwa.isIOS ? "For notifications" : "Home screen"}
        onClick={pwa.canInstall && !pwa.isIOS ? pwa.promptInstall : () => setGuide(true)}
      />
      <Sheet open={guide} onClose={() => setGuide(false)} title="Add Hive to your Home Screen">
        <ol className="space-y-4">
          {(pwa.isIOS
            ? [
                <>Tap the <b>Share</b> button <Share className="-mt-0.5 inline size-4" /> in Safari&apos;s toolbar.</>,
                <>Scroll down and tap <b>Add to Home Screen</b>.</>,
                <>Tap <b>Add</b> — Hive opens full-screen and can send you notifications.</>,
              ]
            : [
                <>Open your browser menu (⋮).</>,
                <>Tap <b>Install app</b> or <b>Add to Home screen</b>.</>,
                <>Confirm — Hive lands on your home screen like a real app.</>,
              ]
          ).map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-acid">{i + 1}</span>
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => setGuide(false)}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          Got it
        </button>
      </Sheet>
    </>
  );
}
