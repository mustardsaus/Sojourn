import { useState } from "react";
import clsx from "clsx";
import { Star } from "@/components/common/AdiScore";

interface AdiScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const STAR_SIZE = 30;

/** The interactive counterpart to `AdiScoreStars` — same star, same
 * gradient-fill rendering, but each star is split into a left/right tap
 * target so half-point increments (matching how `adiScore` is stored
 * everywhere else) work by tapping directly rather than needing a separate
 * slider or stepper control. Works identically with touch or mouse: hover
 * is a mouse-only preview, but a tap always commits immediately. */
export function AdiScoreInput({ value, onChange, className }: AdiScoreInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className={clsx("inline-flex items-center gap-2", className)}>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.min(1, Math.max(0, display - i));
          return (
            <span key={i} className="relative inline-block" style={{ width: STAR_SIZE, height: STAR_SIZE }}>
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Star size={STAR_SIZE} fill={fill} />
              </span>
              <button
                type="button"
                aria-label={`Rate ${i + 0.5} stars`}
                onMouseEnter={() => setHover(i + 0.5)}
                onClick={() => onChange(i + 0.5)}
                className="absolute inset-y-0 left-0 w-1/2"
              />
              <button
                type="button"
                aria-label={`Rate ${i + 1} stars`}
                onMouseEnter={() => setHover(i + 1)}
                onClick={() => onChange(i + 1)}
                className="absolute inset-y-0 right-0 w-1/2"
              />
            </span>
          );
        })}
      </div>
      <span className="font-display text-sm tabular-nums text-text">{value > 0 ? value.toFixed(1) : "—"}</span>
    </div>
  );
}
