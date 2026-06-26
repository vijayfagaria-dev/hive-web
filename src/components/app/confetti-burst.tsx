"use client";

import { useEffect, useState } from "react";

const COLORS = ["#9cce1e", "#c8775a", "#5a9aa0", "#d8a23a", "#d24b6a", "#7fa81a"];

type Piece = { id: number; left: number; delay: number; color: string; rot: number };

/** A lightweight, dependency-free confetti shower — fires once when `fire` flips true. */
export function ConfettiBurst({ fire }: { fire: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!fire) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- spawn confetti once when `fire` flips true
    setPieces(
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        color: COLORS[i % COLORS.length] as string,
        rot: Math.random() * 360,
      })),
    );
    const t = setTimeout(() => setPieces([]), 2800);
    return () => clearTimeout(t);
  }, [fire]);

  if (pieces.length === 0) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-12px] block size-2.5 rounded-[1px]"
          style={{
            left: `${p.left}%`,
            background: p.color,
            ["--rot" as string]: `${p.rot}deg`,
            animation: `confetti-fall 2.6s ${p.delay}s cubic-bezier(.2,.6,.3,1) forwards`,
          }}
        />
      ))}
    </div>
  );
}
