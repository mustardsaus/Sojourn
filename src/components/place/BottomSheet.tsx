import { useEffect, useMemo, useRef, useState, type ReactNode, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from "react";
import { motion, useMotionValue, animate, useReducedMotion } from "framer-motion";
import clsx from "clsx";

export type SheetSnap = "collapsed" | "partial" | "full";

interface BottomSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Always-visible, always-draggable header content (place name, quick
   * route summary, CTA) — this is what stays on screen even collapsed. */
  peek: ReactNode;
  /** The rest of the place's detail — only scrollable/interactive once the
   * sheet reaches "full", since it can genuinely overflow that state. */
  children: ReactNode;
  className?: string;
  /** Fires continuously while dragging (not just on snap changes) with how
   * expanded the sheet currently is: 0 at partial-or-below, 1 at full. Lets
   * a parent fade out whatever floats over the map — e.g. a header — in
   * step with the actual drag instead of jump-cutting on snap changes. */
  onExpansionChange?: (expansion: number) => void;
}

const FULL_FRACTION = 0.92;
const PARTIAL_FRACTION = 0.46;
const MIN_COLLAPSED_PX = 160;
const VELOCITY_FLICK_THRESHOLD = 500;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** A native-feeling bottom sheet: drag the handle/peek header to move
 * between collapsed / partial / full, with a spring settle onto the
 * nearest (or flick-implied) snap point. The detail content below the
 * peek only becomes scrollable once fully expanded — while collapsed or
 * partial it's simply the part of the sheet that's off-screen, not a
 * competing scroll surface, which is what keeps the drag gesture from
 * fighting native scrolling.
 *
 * The drag itself is tracked with plain mouse/touch events rather than
 * Framer's `drag` prop. Framer's numeric `dragConstraints` are computed
 * relative to the element's own initial layout position, which fights with
 * a motion value we also move around externally (via `animate()` for the
 * spring-settle) — the two bookkeeping systems disagree about where "home"
 * is, and drags silently stop moving the element once they disagree.
 *
 * The other real bug this went through: without `select-none` (and
 * `preventDefault` in the mouse handler as a second guard for anything
 * that class doesn't cover), the first drag starts a native text selection
 * over the place name in the peek header. That selection survives the
 * mouseup, and the *second* drag's mousedown then lands inside it — which
 * makes the browser start a native HTML5 text-drag instead of an ordinary
 * gesture, silently swallowing every mousemove for the rest of that drag
 * (and, when this was built on the Pointer Events API instead, firing a
 * `pointercancel` for the same reason). It looked exactly like "drags work
 * once and then die," but the actual cause was text selection, not the
 * event API. */
export function BottomSheet({ snap, onSnapChange, peek, children, className, onExpansionChange }: BottomSheetProps) {
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 800));
  const [peekHeight, setPeekHeight] = useState(140);
  const reduceMotion = useReducedMotion();
  const peekRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ startClientY: number; startOffset: number; startTime: number } | null>(null);

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const el = peekRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height) setPeekHeight(Math.ceil(height));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sheetHeight = Math.round(viewportHeight * FULL_FRACTION);
  const partialVisible = Math.round(viewportHeight * PARTIAL_FRACTION);
  const collapsedVisible = Math.max(peekHeight + 16, MIN_COLLAPSED_PX);

  // Offsets are translateY px values: 0 = fully expanded (top edge at
  // viewportHeight - sheetHeight). Larger = more of the sheet pushed below
  // the viewport, revealing progressively less of it.
  const offsets = useMemo(
    () => ({
      full: 0,
      partial: Math.max(sheetHeight - partialVisible, 0),
      collapsed: Math.max(sheetHeight - collapsedVisible, 0),
    }),
    [sheetHeight, partialVisible, collapsedVisible],
  );

  const y = useMotionValue(offsets[snap]);
  // Slightly soft (a hair under critical damping at this stiffness) so a
  // snap carries the faintest touch of momentum into its resting point
  // instead of arriving dead-stopped — without ever visibly overshooting
  // or bouncing back.
  const settle = (target: SheetSnap) =>
    animate(y, offsets[target], reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32, mass: 1 });

  // "Latest" refs so the window listeners registered at gesture start
  // (which live for the lifetime of that one gesture) always act on
  // current values rather than whatever was current when the gesture began.
  const offsetsRef = useRef(offsets);
  offsetsRef.current = offsets;
  const snapRef = useRef(snap);
  snapRef.current = snap;
  const onSnapChangeRef = useRef(onSnapChange);
  onSnapChangeRef.current = onSnapChange;
  const onExpansionChangeRef = useRef(onExpansionChange);
  onExpansionChangeRef.current = onExpansionChange;

  // Follow external snap changes (prop updates from elsewhere, or our own
  // onSnapChange after a drag/flick) with a spring rather than a hard jump.
  useEffect(() => {
    const controls = settle(snap);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, offsets.full, offsets.partial, offsets.collapsed, reduceMotion]);

  // Report how "full" the sheet currently is on every frame it moves
  // (drag or spring-settle alike) — not just when `snap` itself changes —
  // so a parent can tie something else's fade continuously to the same
  // motion rather than snapping it in a separate, unsynced transition.
  useEffect(() => {
    const report = (value: number) => {
      if (!onExpansionChangeRef.current) return;
      const { full, partial } = offsetsRef.current;
      const span = Math.max(partial - full, 1);
      onExpansionChangeRef.current(clamp((partial - value) / span, 0, 1));
    };
    report(y.get());
    return y.on("change", report);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function nearestSnap(offset: number): SheetSnap {
    const candidates: [SheetSnap, number][] = [
      ["full", offsets.full],
      ["partial", offsets.partial],
      ["collapsed", offsets.collapsed],
    ];
    let nearest: SheetSnap = snap;
    let nearestDistance = Infinity;
    for (const [name, candidateOffset] of candidates) {
      const distance = Math.abs(offset - candidateOffset);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = name;
      }
    }
    return nearest;
  }

  // Shared drag-lifecycle logic for both input types below. The move/end
  // listeners live on `window` (rather than as React props on the handle)
  // so they keep firing for the rest of the gesture even though the
  // handle's own screen position keeps moving as the sheet translates, and
  // even if the pointer's path crosses over the map behind the sheet.
  function beginDrag(startClientY: number) {
    const startOffset = y.get();
    const startTime = performance.now();
    dragState.current = { startClientY, startOffset, startTime };

    function move(clientY: number) {
      const delta = clientY - startClientY;
      y.set(clamp(startOffset + delta, offsetsRef.current.full, offsetsRef.current.collapsed));
    }

    // A real release: use the gesture's own end position/timing so a
    // decisive, fast flick can move a full step even without traveling far.
    function end(clientY: number) {
      dragState.current = null;
      const totalDelta = clientY - startClientY;
      const elapsedMs = Math.max(1, performance.now() - startTime);
      if (Math.abs(totalDelta) > 4) {
        const velocity = (totalDelta / elapsedMs) * 1000;
        if (Math.abs(velocity) > VELOCITY_FLICK_THRESHOLD) {
          const draggingDown = totalDelta > 0;
          const next: SheetSnap = draggingDown
            ? snapRef.current === "full"
              ? "partial"
              : "collapsed"
            : snapRef.current === "collapsed"
              ? "partial"
              : "full";
          onSnapChangeRef.current(next);
          return;
        }
      }
      onSnapChangeRef.current(nearestSnap(y.get()));
    }

    // A cancellation (e.g. touchcancel from an interrupting OS gesture)
    // carries no meaningful position of its own — just stop tracking and
    // settle wherever the sheet currently is, with no flick/velocity
    // reasoning since there's no real gesture to read a direction from.
    function cancel() {
      dragState.current = null;
      onSnapChangeRef.current(nearestSnap(y.get()));
    }

    return { move, end, cancel };
  }

  function handleMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    // Without this, dragging over the place name text starts a native text
    // selection on the first gesture; on the very next drag, the mousedown
    // lands inside that leftover selection and the browser starts a native
    // HTML5 text-drag instead, which silently swallows all further
    // mousemove events for the rest of the gesture. `select-none` below
    // stops the selection from ever starting, but this closes the same
    // door for any content added later that isn't covered by that class.
    event.preventDefault();
    const drag = beginDrag(event.clientY);

    const onMove = (moveEvent: MouseEvent) => drag.move(moveEvent.clientY);
    const onUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      drag.end(upEvent.clientY);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    const touchId = touch.identifier;
    const drag = beginDrag(touch.clientY);

    function findTouch(touchList: TouchList) {
      for (let i = 0; i < touchList.length; i += 1) {
        if (touchList[i].identifier === touchId) return touchList[i];
      }
      return null;
    }

    const onMove = (moveEvent: TouchEvent) => {
      const active = findTouch(moveEvent.touches);
      if (!active) return;
      drag.move(active.clientY);
    };
    const onEnd = (endEvent: TouchEvent) => {
      const ended = findTouch(endEvent.changedTouches);
      if (!ended) return;
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onCancel);
      drag.end(ended.clientY);
    };
    const onCancel = (cancelEvent: TouchEvent) => {
      const cancelled = findTouch(cancelEvent.changedTouches);
      if (!cancelled) return;
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onCancel);
      drag.cancel();
    };

    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onCancel);
  }

  return (
    <motion.div
      style={{ y, height: sheetHeight }}
      className={clsx(
        "absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-[24px] bg-surface shadow-[0_-16px_44px_-12px_rgba(0,0,0,0.32)]",
        className,
      )}
    >
      <div
        ref={peekRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="flex shrink-0 cursor-grab touch-none select-none flex-col gap-3 pb-3 pt-2.5 active:cursor-grabbing"
      >
        <div className="mx-auto h-1 w-9 shrink-0 rounded-full bg-text-faint/40" />
        {peek}
      </div>
      <div className={clsx("min-h-0 flex-1", snap === "full" ? "overflow-y-auto" : "pointer-events-none overflow-hidden")}>
        {children}
      </div>
    </motion.div>
  );
}
