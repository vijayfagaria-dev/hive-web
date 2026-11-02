"use client";

import { useState } from "react";
import { Check, Copy, MapPin } from "lucide-react";
import type { GettingHere } from "@/lib/api";
import { useIsIOS } from "@/lib/platform";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const link = (extra?: string) => cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full", extra);

export function GettingHereCard({ here }: { here: GettingHere }) {
  const [copied, setCopied] = useState(false);
  const ios = useIsIOS();
  if (!here) return null;
  // Rapido can't take a pre-filled drop, so tapping it also copies the address to paste.
  const rapido = ios ? here.rapidoWeb : here.rapido;

  async function copy() {
    if (!here?.address) return;
    await navigator.clipboard.writeText(here.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-acid">
        <MapPin className="size-4" /> Getting here
      </div>

      {here.unit && <p className="mt-3 text-lg font-semibold">{here.unit}</p>}
      {here.address && (
        <p className={cn(here.unit ? "mt-1 text-sm text-muted-foreground" : "mt-3 text-lg")}>{here.address}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {here.directions && (
          <a href={here.directions} target="_blank" rel="noopener" className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
            🧭 Navigate
          </a>
        )}
        {here.address && (
          <button type="button" onClick={copy} className={link("gap-1.5")}>
            {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy address"}
          </button>
        )}
        {here.uber && <a href={here.uber} target="_blank" rel="noopener" className={link()}>🚗 Uber</a>}
        {here.ola && <a href={here.ola} target="_blank" rel="noopener" className={link()}>🟢 Ola</a>}
        {rapido && (
          <a href={rapido} target="_blank" rel="noopener" onClick={copy} className={link()}>
            🛵 Rapido
          </a>
        )}
      </div>
      {here.directions && (
        <p className="mt-3 text-xs text-muted-foreground">
          Uber &amp; Ola pre-fill the flat. Rapido copies the address — paste it as your drop.
        </p>
      )}
    </section>
  );
}
