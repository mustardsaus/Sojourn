import { motion } from "framer-motion";
import { getCategoryColor, getCategoryConfig, getSecondLevelLabel } from "@/config/categories";
import { AdiScore } from "@/components/common/AdiScore";
import type { Location } from "@/types/location";

interface LocationRowProps {
  location: Location;
  onSelect: (location: Location) => void;
  layoutId?: string;
}

/** The recurring "thumbnail / name / category / rating / View" row used
 * for viewport cards, search results, and anywhere else a location needs
 * a compact list representation. */
export function LocationRow({ location, onSelect, layoutId }: LocationRowProps) {
  const color = getCategoryColor(location.topLevelCategory);
  const categoryLabel = getCategoryConfig(location.topLevelCategory).label;
  const secondLabel = getSecondLevelLabel(location.topLevelCategory, location.secondLevelCategory);

  return (
    <motion.button
      layoutId={layoutId}
      onClick={() => onSelect(location)}
      whileTap={{ scale: 0.985 }}
      className="group flex w-full shrink-0 items-center gap-4 rounded-2xl bg-surface-row p-2.5 pr-5 text-left shadow-[0_-4px_2px_rgba(0,0,0,0.05)]"
    >
      <div className="relative h-[116px] w-[124px] shrink-0 overflow-hidden rounded-xl">
        <img src={location.image} alt="" loading="lazy" className="size-full object-cover" />
        <span
          className="absolute bottom-2 left-2 rounded-full px-2 py-0.5 font-accent text-[10px] font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {categoryLabel}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 self-stretch py-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-display text-lg text-text">{location.name}</p>
          <AdiScore score={location.adiScore} size="sm" />
        </div>
        <p className="font-accent text-xs font-medium" style={{ color }}>
          {secondLabel}
        </p>
        {location.description && (
          <p className="line-clamp-2 font-body text-xs leading-relaxed text-text-faint">{location.description}</p>
        )}
        <span className="mt-auto font-body text-[11px] text-text opacity-70 transition-opacity group-hover:opacity-100">
          View place →
        </span>
      </div>
    </motion.button>
  );
}
