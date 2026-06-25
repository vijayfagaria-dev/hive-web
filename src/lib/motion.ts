import type { Transition, Variants } from "motion/react";

/** A refined "out-expo" ease — fast start, soft landing. The house ease. */
export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Springs for interactive elements (buttons, cards, layout shifts). */
export const spring = { type: "spring", stiffness: 320, damping: 32, mass: 0.9 } satisfies Transition;
export const springSoft = { type: "spring", stiffness: 180, damping: 26 } satisfies Transition;

/** Fade + rise. `custom` is an extra delay (seconds) for hand-tuned sequencing. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: easeOut, delay },
  }),
};

/** Fade only — for things that shouldn't move (large headlines, images). */
export const fade: Variants = {
  hidden: { opacity: 0 },
  show: (delay: number = 0) => ({ opacity: 1, transition: { duration: 0.7, ease: easeOut, delay } }),
};

/** Parent that staggers its children's `show` state. */
export const stagger = (gap = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
