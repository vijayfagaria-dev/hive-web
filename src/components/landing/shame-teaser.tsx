"use client";

import { motion } from "motion/react";
import { usePublicStats } from "@/lib/queries";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SAMPLE = [
  { name: "Rohit", fines: 9, total: 470 },
  { name: "Amit", fines: 6, total: 300 },
  { name: "Priya", fines: 4, total: 220 },
  { name: "Zoe", fines: 3, total: 150 },
  { name: "Dev", fines: 2, total: 100 },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export function ShameTeaser() {
  const { data } = usePublicStats();
  const rows = (data?.hallOfShame.length ? data.hallOfShame : SAMPLE).slice(0, 5);

  return (
    <motion.ul
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="glass mx-auto max-w-xl overflow-hidden rounded-2xl"
    >
      {rows.map((r, i) => (
        <motion.li
          key={r.name + i}
          variants={fadeUp}
          className="flex items-center gap-4 border-b border-white/5 px-5 py-4 last:border-0"
        >
          <span className="w-7 text-center font-mono text-sm tabular-nums text-muted-foreground">
            {i < 3 ? MEDALS[i] : String(i + 1).padStart(2, "0")}
          </span>
          <span className="flex-1 font-semibold">{r.name}</span>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {r.fines} {r.fines === 1 ? "fine" : "fines"}
          </span>
          <span className={cn("w-20 text-right font-semibold tabular-nums", i === 0 && "text-acid")}>
            ₹{r.total.toLocaleString("en-IN")}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
