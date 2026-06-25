"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay in seconds, for sequencing a group by hand. */
  delay?: number;
  variants?: Variants;
  once?: boolean;
};

/** Animates its children in as they scroll into view (reduced-motion aware via MotionConfig). */
export function Reveal({ children, className, delay = 0, variants = fadeUp, once = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-80px" }}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}
