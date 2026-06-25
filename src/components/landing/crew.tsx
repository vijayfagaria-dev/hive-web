import { Reveal } from "@/components/reveal";

/* Archetypes, not real people — swap in the actual crew (name + photo) later. */
const CREW = [
  { emoji: "⚖️", role: "The Enforcer", blurb: "Files fines before the kettle boils." },
  { emoji: "💸", role: "The Repeat Offender", blurb: "Single-handedly funds the pot." },
  { emoji: "👻", role: "The Ghost", blurb: "Somehow never gets caught." },
  { emoji: "🎟️", role: "The Host", blurb: "Always has a guest 'just for one night'." },
  { emoji: "🫙", role: "The Treasurer", blurb: "Guards the jar with their life." },
  { emoji: "🌱", role: "The Newbie", blurb: "Still thinks the rules are negotiable." },
] as const;

export function Crew() {
  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CREW.map((m, i) => (
        <Reveal key={m.role} delay={i * 0.05}>
          <div className="group glass flex h-full items-start gap-4 rounded-2xl p-5 transition-colors hover:border-acid/40">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/5 text-2xl ring-1 ring-white/10 transition-transform group-hover:-rotate-6">
              {m.emoji}
            </span>
            <div>
              <p className="font-semibold">{m.role}</p>
              <p className="mt-1 text-sm text-muted-foreground">{m.blurb}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
