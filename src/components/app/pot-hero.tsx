import { CountUp } from "@/components/landing/count-up";

/** The signature pot figure — big animated ₹ total + confirmed-fine count. */
export function PotHero({ pot, count, label = "In the jar" }: { pot: number; count: number; label?: string }) {
  return (
    <div className="relative text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]"
      />
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">🫙 {label}</p>
      <p className="mt-3 font-heading text-6xl font-bold leading-none tracking-tight tabular-nums sm:text-7xl">
        <CountUp value={pot} prefix="₹" />
      </p>
      <p className="mt-3 text-muted-foreground">
        from {count} confirmed {count === 1 ? "fine" : "fines"}
      </p>
    </div>
  );
}
