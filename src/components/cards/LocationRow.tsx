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
      className="group flex w-full shrink-0 items-center gap-3 rounded-lg bg-surface-row px-1.5 py-1.5 pr-3 text-left shadow-[0_-4px_2px_rgba(0,0,0,0.06)]"
    >
      <div className="relative h-[50px] w-[73px] shrink-0 overflow-hidden rounded">
        <img src={location.image} alt="" loading="lazy" className="size-full object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate font-body text-xs text-text">{location.name}</p>
          <div className="flex items-center gap-3">
            <p className="font-accent text-xs font-medium" style={{ color }}>
              {categoryLabel} | {secondLabel}
            </p>
            <AdiScore score={location.adiScore} size="sm" />
          </div>
        </div>
        <span className="shrink-0 font-body text-xs text-text opacity-70 transition-opacity group-hover:opacity-100">
          View
        </span>
      </div>
    </motion.button>
  );
}
