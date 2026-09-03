import { motion, type MotionValue } from "framer-motion";
import clsx from "clsx";

interface HeaderMapScrimProps {
  /** Drives the whole scrim's opacity (e.g. fading it out together with
   * the header as a drawer reaches "full"). Static 1 when omitted. */
  opacity?: MotionValue<number>;
  className?: string;
}

/** The map doesn't stop at some rectangle — it extends the full height of
 * the page, including underneath the header, and gradually disappears
 * into it. A single flat, fully-opaque fill plus a heavy `backdrop-filter`
 * blur, with one `mask-image` gradient doing all the fading: both the tint
 * and the blur it sits on top of are just this element's rendered pixels,
 * so tapering the element's own alpha tapers both together, with no hard
 * edge anywhere.
 *
 * The alpha isn't a single top-to-bottom fade, though — it's a short dip,
 * then a plateau, then a fade: barely-there at the very top edge (the
 * status-bar strip above the header, where a faint trace of blurred map
 * should still read through), ramping up to fully opaque behind the
 * header title and search bar (where text needs to stay legible over
 * whatever busy, colorful map content happens to sit underneath it),
 * then fading back out to nothing so the map below reappears sharp. */
export function HeaderMapScrim({ opacity, className }: HeaderMapScrimProps) {
  return (
    <motion.div
      style={{
        opacity,
        background: "var(--color-bg)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.45) 8%, black 26%, black 74%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.45) 8%, black 26%, black 74%, transparent 100%)",
      }}
      className={clsx("pointer-events-none absolute inset-x-0 top-0 z-10 h-72", className)}
    />
  );
}
