import type { Variants } from "framer-motion";

/** Shared entrance choreography for the first-load "interface assembling
 * itself around the map" moment (see `MapRevealVeil` and `consumeIntroFlag`).
 * Each top-level UI block (header, drawer) gets its own small wrapper that
 * switches from "hidden" to "visible" once the map reveal finishes — the
 * drawer uses the `*Delayed` variant so it settles in a beat after the
 * header rather than both arriving in lockstep. Only ever used on the
 * true first load; every other mount renders these blocks with no wrapper
 * at all (see the `playIntro` branches in Dashboard/PlacePage), so this
 * has zero effect on ordinary navigation. */
export const introItemVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export const introItemVariantsDelayed: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Reduced-motion counterpart: no movement or blur, just a quick plain
 * fade — "significantly simplified," not disabled outright, so the
 * interface doesn't just snap into existence with zero transition. */
export const introItemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

export const introItemVariantsReducedDelayed: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, delay: 0.08 } },
};
