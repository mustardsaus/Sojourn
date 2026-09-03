import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface MapRevealVeilProps {
  /** Renders and runs the reveal. Parents pass `false` on every mount that
   * isn't the app's true first load (see `consumeIntroFlag`) so this
   * component simply never appears again after that. */
  active: boolean;
  onDone?: () => void;
}

const REVEAL_DURATION_S = 2.6;
const REVEAL_EASE: [number, number, number, number] = [0.45, 0, 0.2, 1];
const START_BLUR_PX = 26;
const REDUCED_FADE_S = 0.4;

/**
 * The map's first appearance: not a fade, not a spinner, not a fast
 * circular wipe — a soft, slowly-expanding "hole" opening at the center of
 * the screen, its edge a wide blurred feather rather than a hard line, so
 * the map reads as gradually resolving into focus outward from the middle
 * rather than being unmasked.
 *
 * Mechanically this is a full-screen div painted in the page background
 * color, with `mask-image: radial-gradient(...)` carving a growing
 * transparent circle out of its center (so the map underneath shows
 * through there) and `backdrop-filter: blur()` on the div itself, which —
 * because it only ever paints where the mask hasn't gone fully transparent
 * — blurs exactly the feathered ring at the growing edge and nowhere else.
 * That's what gives the "layered blur-to-sharp" quality: freshly-revealed
 * map is instantly sharp, the boundary just ahead of it is soft, and
 * everything further out is still fully hidden.
 *
 * Driven by a plain `animate()` writing directly to the DOM node via a ref
 * rather than React state, so ~150 frames over 2.6s never trigger a
 * re-render — this is the one animation in the app that truly runs once,
 * so there's no reactive state anywhere else that needs to stay in sync
 * with it frame-by-frame.
 *
 * `prefers-reduced-motion` gets a much simpler treatment per the brief:
 * a brief plain opacity fade, no geometric sweep at all.
 */
export function MapRevealVeil({ active, onDone }: MapRevealVeilProps) {
  const prefersReduced = useReducedMotion();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [finished, setFinished] = useState(false);

  // `onDone` is typically a fresh inline function on every render of
  // whichever page renders this (Dashboard/PlacePage re-render often while
  // data loads in). Keeping it in a ref rather than the effect's own
  // dependency array means a parent re-render never re-runs this effect —
  // otherwise React would tear down and rebuild it mid-animation.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Deliberately no "have I already started" ref here: this effect needs
  // to be safely restartable, because React 18 StrictMode's dev-only
  // mount -> cleanup -> mount cycle does exactly that once on every first
  // render. A guard that blocks re-starting (as an earlier version of this
  // component had) makes that StrictMode cleanup permanently kill the
  // animation — cleanup stops it, the guard then refuses to start a
  // replacement, and the veil freezes mid-reveal forever. Depending only on
  // `[active, prefersReduced]` (both stable for the life of a real mount)
  // means the effect naturally runs once in production and safely
  // restarts once in dev, landing in the same end state either way.
  useEffect(() => {
    if (!active) return;
    const el = elementRef.current;
    if (!el) return;

    if (prefersReduced) {
      const controls = animate(1, 0, {
        duration: REDUCED_FADE_S,
        ease: "easeOut",
        onUpdate: (v) => {
          el.style.opacity = String(v);
        },
        onComplete: () => {
          setFinished(true);
          onDoneRef.current?.();
        },
      });
      return () => controls.stop();
    }

    const diagonal = Math.hypot(window.innerWidth, window.innerHeight);
    const maxRadius = diagonal * 0.62;
    const feather = Math.max(200, diagonal * 0.24);

    const controls = animate(0, 1, {
      duration: REVEAL_DURATION_S,
      ease: REVEAL_EASE,
      onUpdate: (t) => {
        const r = t * maxRadius;
        const blur = START_BLUR_PX * (1 - t);
        const mask =
          `radial-gradient(circle at 50% 50%, transparent 0px, transparent ${r}px, ` +
          `rgba(0,0,0,0.65) ${r + feather * 0.5}px, black ${r + feather}px)`;
        el.style.setProperty("backdrop-filter", `blur(${blur}px)`);
        el.style.setProperty("-webkit-backdrop-filter", `blur(${blur}px)`);
        el.style.setProperty("mask-image", mask);
        el.style.setProperty("-webkit-mask-image", mask);
      },
      onComplete: () => {
        setFinished(true);
        onDoneRef.current?.();
      },
    });
    return () => controls.stop();
  }, [active, prefersReduced]);

  if (!active || finished) return null;

  return (
    <div
      ref={elementRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
      style={{
        background: "var(--color-bg)",
        backdropFilter: `blur(${START_BLUR_PX}px)`,
        WebkitBackdropFilter: `blur(${START_BLUR_PX}px)`,
        maskImage: "radial-gradient(circle at 50% 50%, transparent 0px, transparent 0px, rgba(0,0,0,0.65) 100px, black 320px)",
        WebkitMaskImage: "radial-gradient(circle at 50% 50%, transparent 0px, transparent 0px, rgba(0,0,0,0.65) 100px, black 320px)",
      }}
    />
  );
}
