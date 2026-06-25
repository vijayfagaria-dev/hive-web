"use client";

import { useState } from "react";
import { Check, Copy, MapPin } from "lucide-react";
import type { GettingHere } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const link = (extra?: string) => cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full", extra);

export function GettingHereCard({ here }: { here: GettingHere }) {
  const [copied, setCopied] = useState(false);
  if (!here) return null;

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

      {here.address && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-lg">{here.address}</p>
          <button onClick={copy} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
            {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {here.directions && (
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={here.directions} target="_blank" rel="noopener" className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
            🧭 Navigate
          </a>
          {here.uber && <a href={here.uber} target="_blank" rel="noopener" className={link()}>🚗 Uber</a>}
          {here.ola && <a href={here.ola} target="_blank" rel="noopener" className={link()}>🟢 Ola</a>}
          {here.rapido && <a href={here.rapido} target="_blank" rel="noopener" className={link()}>🛵 Rapido</a>}
        </div>
      )}
      {here.directions && (
        <p className="mt-3 text-xs text-muted-foreground">
          Uber &amp; Ola pre-fill the flat; Rapido opens the app — paste the copied address.
        </p>
      )}
    </section>
  );
}
