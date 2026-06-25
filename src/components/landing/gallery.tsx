import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";

/*
  Placeholder "frames" until real photos land in /public. Each is a moody acid-on-
  black tile mapped to an NFC spot. To use a real photo, drop it in /public and
  replace the gradient div with <Image src=… fill className="object-cover" />.
*/
const FRAMES = [
  { emoji: "🍳", title: "The kitchen", caption: "Scene of most crimes.", span: "col-span-2 md:row-span-2", gradient: "from-acid/25 via-black to-black" },
  { emoji: "🚬", title: "The balcony", caption: "2 a.m. singalongs happen here.", span: "", gradient: "from-acid/20 to-black" },
  { emoji: "📺", title: "The living room", caption: "Where verdicts are read.", span: "", gradient: "from-black to-acid/15" },
  { emoji: "🧊", title: "The fridge", caption: "Snacks & the pot, cohabiting.", span: "", gradient: "from-black via-black to-acid/15" },
  { emoji: "🚪", title: "The front door", caption: "Guests are warned on arrival.", span: "", gradient: "from-acid/20 to-black" },
  { emoji: "🚽", title: "The bathroom", caption: "No further comment.", span: "", gradient: "from-black to-acid/15" },
] as const;

export function Gallery() {
  return (
    <div className="mx-auto grid w-full max-w-6xl auto-rows-[10rem] grid-cols-2 gap-3 md:auto-rows-[11rem] md:grid-cols-3">
      {FRAMES.map((f, i) => (
        <Reveal
          key={f.title}
          delay={i * 0.05}
          className={cn(
            "group relative isolate overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-acid/40",
            f.span,
          )}
        >
          <div className={cn("absolute inset-0 -z-10 bg-gradient-to-br transition-transform duration-700 group-hover:scale-105", f.gradient)} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <span className="absolute right-4 top-3 text-5xl opacity-25 grayscale transition-opacity duration-500 group-hover:opacity-40 md:text-6xl">
            {f.emoji}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
            <p className="text-lg font-semibold text-white">{f.title}</p>
            <p className="text-sm text-white/60">{f.caption}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
