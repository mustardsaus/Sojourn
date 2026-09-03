import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

const variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
} as const;

/** The Contribute form's one animation primitive: a section either isn't
 * there yet, or slides gently up into place once its prerequisite is met.
 * `layout` on the wrapper lets everything below smoothly reflow as a new
 * section takes up space, rather than the rest of the page jump-cutting
 * down. Never removed once shown except by an explicit category change
 * (handled by the caller re-keying its own subtree) — this only ever
 * animates forward. */
export function RevealSection({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div layout initial="hidden" animate="visible" exit="exit" variants={variants}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
