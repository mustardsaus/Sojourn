import { motion, type MotionValue } from "framer-motion";
import clsx from "clsx";

interface HeaderMapScrimProps {
  /** Drives the whole scrim's opacity (e.g. fading it out together with
   * the header as a drawer reaches "full"). Static 1 when omitted. */
  opacity?: MotionValue<number>;
  className?: string;
}

/** The header sits on the same living map as the rest of the page, rather
 * than a flat opaque bar — but only just barely: this is almost entirely
 * the page's own background color (94% of it), blurred, so only the
 * faintest hint of whatever's on the map underneath ever comes through.
 * Enough to feel connected to the map rather than a hard-edged card
 * stamped on top of it; not enough to threaten legibility.
 *
 * A single flat fill plus `backdrop-filter` blur, with one `mask-image`
 * gradient fading both together at the bottom edge — no hard line where
 * the header ends and the fully-visible map begins. */
export function HeaderMapScrim({ opacity, className }: HeaderMapScrimProps) {
  return (
    <motion.div
      style={{
        opacity,
        background: "var(--color-bg)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.94) 72%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.94) 72%, transparent 100%)",
      }}
      className={clsx("pointer-events-none absolute inset-x-0 top-0 z-10 h-72", className)}
    />
  );
}
