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
 * into it. This is what does that disappearing: a heavy `backdrop-filter`
 * blur so any roads back there read as faint texture rather than
 * functional map content, plus the page's own background color fading in
 * on top of that blur. Both are wrapped in the same `mask-image` gradient
 * so the blur itself — not just the tint on top of it — tapers smoothly
 * to nothing rather than snapping off at a hard rectangular edge, which
 * is what a plain `backdrop-blur-xl` utility would do on its own. */
export function HeaderMapScrim({ opacity, className }: HeaderMapScrimProps) {
  return (
    <motion.div
      style={{
        opacity,
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
      }}
      className={clsx(
        "pointer-events-none absolute inset-x-0 top-0 z-10 h-64 bg-gradient-to-b from-bg via-bg/75 to-transparent",
        className,
      )}
    />
  );
}
