import { AnimatePresence, motion } from "framer-motion";
import type { Location } from "@/types/location";
import { LocationRow } from "@/components/cards/LocationRow";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";

interface SearchResultsProps {
  visible: boolean;
  query: string;
  results: Location[];
  isSearching: boolean;
  onSelect: (location: Location) => void;
}

export function SearchResults({ visible, query, results, isSearching, onSelect }: SearchResultsProps) {
  return (
    <AnimatePresence>
      {visible && query.trim() && (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="no-scrollbar overflow-hidden"
        >
          <div className="no-scrollbar mt-2 flex max-h-[46vh] flex-col gap-1.5 overflow-y-auto rounded-xl bg-surface p-2 shadow-card">
            {isSearching && results.length === 0 && (
              <div className="flex items-center justify-center py-6">
                <LoadingSpinner className="size-4 text-accent" />
              </div>
            )}
            {!isSearching && results.length === 0 && (
              <EmptyState title="No places match that" description="Try a name, a category, or a neighborhood." />
            )}
            {results.map((location) => (
              <LocationRow key={location.id} location={location} onSelect={onSelect} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
