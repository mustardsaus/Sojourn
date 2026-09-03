import { AnimatePresence, motion } from "framer-motion";
import type { Location } from "@/types/location";
import { LocationRow } from "./LocationRow";
import { EmptyState } from "@/components/common/EmptyState";

interface ViewportLocationCardsProps {
  locations: Location[];
  onSelect: (location: Location) => void;
  isLoading?: boolean;
}

/** The scrollable card list synced to the map's current viewport, living
 * inside the Dashboard's map drawer (see `Dashboard.tsx`) rather than a
 * bounded section of its own — so no separate panel chrome here, the
 * drawer itself is the frame. Each row still animates in/out as the
 * viewport set changes, so panning genuinely feels connected to the map
 * above it. */
export function ViewportLocationCards({ locations, onSelect, isLoading }: ViewportLocationCardsProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pb-1">
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
              transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            >
              <LocationRow location={location} onSelect={onSelect} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
