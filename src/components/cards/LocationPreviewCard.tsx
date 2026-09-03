import { motion } from "framer-motion";
import { getCategoryColor, getCategoryConfig } from "@/config/categories";
import { AdiScore } from "@/components/common/AdiScore";
import type { Location } from "@/types/location";

interface LocationPreviewCardProps {
  location: Location;
  onGo: (location: Location) => void;
  onDismiss: () => void;
}

export function LocationPreviewCard({ location, onGo, onDismiss }: LocationPreviewCardProps) {
  const color = getCategoryColor(location.topLevelCategory);
  const categoryLabel = getCategoryConfig(location.topLevelCategory).label;

  return (
    <motion.div
      layoutId={`pin-card-${location.id}`}
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-surface p-2.5 pr-3 shadow-card backdrop-blur-md"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <img src={location.image} alt="" className="size-full object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate font-display text-base text-text">{location.name}</p>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 font-accent text-[10px] font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {categoryLabel}
          </span>
          <AdiScore score={location.adiScore} size="sm" />
        </div>
      </div>
      <button
        onClick={() => onGo(location)}
        className="shrink-0 rounded-[10px] border border-accent-soft bg-accent px-4 py-2 font-display text-xs text-white shadow-sm transition-transform active:scale-95"
      >
        Let&rsquo;s go
      </button>
      <button
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-bg text-text shadow-card"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}
