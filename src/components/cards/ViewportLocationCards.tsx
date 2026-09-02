import { AnimatePresence, motion } from "framer-motion";
import type { Location } from "@/types/location";
import { LocationRow } from "./LocationRow";
import { EmptyState } from "@/components/common/EmptyState";

interface ViewportLocationCardsProps {
  locations: Location[];
  onSelect: (location: Location) => void;
  isLoading?: boolean;
}

/** The card rail synced to the map's current viewport. Following the
 * Figma reference, this renders as a stacked list inside a soft panel
 * rather than a horizontal rail — but each row still animates in/out as
 * the viewport set changes, so panning genuinely feels connected to the
 * map above it. */
export function ViewportLocationCards({ locations, onSelect, isLoading }: ViewportLocationCardsProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 rounded-[10px] bg-bg-elevated p-3">
      <div className="flex items-center justify-between px-1">
        <p className="font-display text-xs text-text">In view</p>
        <p className="font-body text-[11px] text-text-faint">
          {locations.length} {locations.length === 1 ? "place" : "places"}
        </p>
      </div>
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {locations.length === 0 && !isLoading && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState
                title="Nothing here yet"
                description="Pan or zoom the map, or try a different category."
              />
            </motion.div>
          )}
          {locations.map((location) => (
            <motion.div
              key={location.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <LocationRow location={location} onSelect={onSelect} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
