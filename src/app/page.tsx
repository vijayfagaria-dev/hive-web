import Link from "next/link";
import { ChevronDown, Coins, ScrollText, Smartphone, Sparkles } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LivePot } from "@/components/landing/live-pot";
import { ShameTeaser } from "@/components/landing/shame-teaser";
import { Gallery } from "@/components/landing/gallery";
import { Crew } from "@/components/landing/crew";

const ctaPrimary =
  "h-12 rounded-full px-7 text-base font-semibold transition-transform hover:-translate-y-0.5 glow-acid";
const ctaGhost =
  "h-12 rounded-full px-7 text-base font-medium transition-transform hover:-translate-y-0.5";

const FEATURES = [
  { icon: ScrollText, title: "A hundred house rules", body: "Dishes, noise, that one guy's alarm. Codified, priced, and impossible to argue with." },
  { icon: Coins, title: "Fines & the pot", body: "Every fine feeds a shared jar. The app keeps score; it never touches the money." },
  { icon: Smartphone, title: "Tap-to-snitch NFC", body: "Stickers around the flat. Tap the kitchen, report the kitchen — pre-filtered to the crime scene." },
  { icon: Sparkles, title: "A guest experience", body: "Visitors get a welcome page, the rules as a menu, and directions to your door." },
];

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      {/* ── Hero ── */}
      <section className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
        <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em]">Hive</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }), "rounded-full px-4 font-semibold")}>
              Join
            </Link>
          </div>
        </header>

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[34%] -z-10 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-acid/15 blur-[140px]"
        />
        <Reveal>
          <Eyebrow className="text-acid">The flat that keeps score</Eyebrow>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-bold leading-[0.92] tracking-tight sm:text-7xl md:text-[5.5rem]">
            Six friends. <br className="hidden sm:block" />
            One <span className="text-acid text-glow">ruthless</span> little democracy.
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-7 max-w-xl text-pretty text-lg text-muted-foreground">
            House rules, fines, a shared pot, and a frankly unreasonable amount of polish — home for
            people who refuse to do the dishes.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), ctaPrimary)}>
              Enter the Hive
            </Link>
            <Link href="#pot" className={cn(buttonVariants({ variant: "outline", size: "lg" }), ctaGhost)}>
              See the damage
            </Link>
          </div>
        </Reveal>

        <Link
          href="#pot"
          aria-label="Scroll down"
          className="absolute bottom-8 text-muted-foreground transition-colors hover:text-foreground motion-safe:animate-bounce"
        >
          <ChevronDown className="size-6" />
        </Link>
      </section>

      {/* ── The pot (live) ── */}
      <section id="pot" className="mx-auto w-full max-w-5xl px-6 py-28 md:py-36">
        <LivePot />
      </section>

      {/* ── The pitch ── */}
      <section className="border-y border-border bg-white/[0.015] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Run the flat like a tiny, ruthless democracy.
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-acid/10 text-acid ring-1 ring-acid/20">
                    <f.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                    <p className="mt-1.5 text-pretty text-muted-foreground">{f.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto mb-12 max-w-6xl">
          <Reveal>
            <Eyebrow>Inside the Hive</Eyebrow>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Every room has <span className="text-acid">a record.</span>
            </h2>
          </Reveal>
        </div>
        <Gallery />
      </section>

      {/* ── The crew ── */}
      <section className="border-t border-border px-6 py-24 md:py-32">
        <div className="mx-auto mb-12 max-w-5xl text-center">
          <Reveal>
            <Eyebrow>The residents</Eyebrow>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Know your suspects.</h2>
          </Reveal>
        </div>
        <Crew />
      </section>

      {/* ── Hall of Shame + CTA ── */}
      <section className="border-t border-border px-6 py-28 md:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Current standings</Eyebrow>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              The <span className="text-acid">Hall of Shame.</span>
            </h2>
          </Reveal>
        </div>
        <div className="mx-auto mt-14 max-w-xl">
          <ShameTeaser />
        </div>

        <div className="mx-auto mt-28 max-w-2xl text-center">
          <Reveal>
            <h2 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Ready to keep score?
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-md text-pretty text-muted-foreground">
              It takes thirty seconds and immediately makes your flatmates nervous.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), ctaPrimary, "mt-8")}>
              Enter the Hive
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-12 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Hive · the bot is the ledger, the wallet is the jar.
      </footer>
    </main>
  );
}
