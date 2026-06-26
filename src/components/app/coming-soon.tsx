export function ComingSoon({ emoji, title, note }: { emoji: string; title: string; note: string }) {
  return (
    <main className="mx-auto flex min-h-[60svh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl" aria-hidden>
        {emoji}
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-pretty text-muted-foreground">{note}</p>
      <span className="mt-5 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Coming soon
      </span>
    </main>
  );
}
