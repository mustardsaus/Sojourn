import clsx from "clsx";

interface AdiScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

/** Adi's personal 5-star rating. Renders a compact numeric + star form by
 * default (matches the Figma cards) with an optional full star row for
 * the expanded Place Page. */
export function AdiScore({ score, size = "sm", className, showLabel = true }: AdiScoreProps) {
  const starSize = size === "lg" ? 16 : size === "md" ? 13 : 10;
  return (
    <span className={clsx("inline-flex items-center gap-1", className)}>
      {showLabel && (
        <span
          className="font-display leading-none text-text tabular-nums"
          style={{ fontSize: size === "lg" ? 15 : size === "md" ? 12 : 10 }}
        >
          {score.toFixed(1)}
        </span>
      )}
      <Star size={starSize} />
    </span>
  );
}

export function AdiScoreStars({ score, className }: { score: number; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, score - i));
        return <Star key={i} size={16} fill={fill} />;
      })}
    </span>
  );
}

/** Exported so the Contribute form's interactive rating input can reuse the
 * exact same star rendering — same gradient-fill technique, just driven by
 * click position instead of a fixed score. */
export function Star({ size, fill = 1 }: { size: number; fill?: number }) {
  const gradId = `star-fill-${size}-${fill}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id={gradId}>
          <stop offset={`${fill * 100}%`} stopColor="#f4b429" />
          <stop offset={`${fill * 100}%`} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.9 6.14 6.6.79-4.86 4.63 1.28 6.6L12 17.6l-5.92 3.06 1.28-6.6L2.5 9.43l6.6-.79L12 2.5z"
        fill={`url(#${gradId})`}
        stroke="#f4b429"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
