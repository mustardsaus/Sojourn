import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Location } from "@/types/location";
import type { RouteOrigin } from "@/hooks/useRoute";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface RouteControlsProps {
  origin: RouteOrigin;
  onOriginChange: (origin: RouteOrigin) => void;
  destination: Location;
  savedLocations: Location[];
}

const CURRENT_LOCATION_LABEL = "Your Current Location";

/** The From/To pair, lived inline in the floating header directly beneath
 * "Plotting your Sojourn" — compact single-line rows rather than the
 * larger labeled-field treatment this used to have as its own block in
 * the drawer, since header real estate is tight and this needs to read
 * as a quiet subtitle to the heading, not a competing form.
 *
 * From is a real text field, not just a picker: type to search, pick a
 * suggestion (or "Your Current Location"), and the route recalculates
 * from there. Selecting a location only ever changes `origin` — the
 * actual road route, distance, and time all come from `useRoute` (via
 * `useRoadRoute`) recomputing against the new coordinates, same as
 * before; this component just needs to call `onOriginChange`. */
export function RouteControls({ origin, onOriginChange, destination, savedLocations }: RouteControlsProps) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, isSearching } = useLocationSearch(query);

  const originLabel = origin.type === "current" ? CURRENT_LOCATION_LABEL : origin.location.name;
  const trimmed = query.trim();

  const suggestions = useMemo(() => {
    const pool = trimmed ? results : savedLocations;
    return pool.filter((l) => l.id !== destination.id).slice(0, 8);
  }, [trimmed, results, savedLocations, destination.id]);

  const showCurrentOption = !trimmed || CURRENT_LOCATION_LABEL.toLowerCase().includes(trimmed.toLowerCase());

  function close() {
    setFocused(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function selectCurrent() {
    onOriginChange({ type: "current" });
    close();
  }

  function selectLocation(location: Location) {
    onOriginChange({ type: "location", location });
    close();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <div className="flex items-center gap-2 border-b border-line pb-[3px]">
          <span className="shrink-0 font-body text-[10px] font-medium uppercase tracking-wide text-text-faint">
            From
          </span>
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={focused ? query : originLabel}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              setFocused(true);
              setQuery("");
            }}
            onBlur={() => setFocused(false)}
            placeholder="Search a location…"
            aria-label="Route origin"
            className="min-w-0 flex-1 truncate bg-transparent font-display text-sm text-text-soft placeholder:text-text-faint focus:outline-none"
          />
        </div>

        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="no-scrollbar absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-xl bg-surface p-1 shadow-card"
            >
              {showCurrentOption && (
                // onMouseDown (not onClick) fires before the input's blur,
                // and preventDefault stops that blur from happening at
                // all — otherwise the dropdown would close itself a beat
                // before the click landed.
                <button
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={selectCurrent}
                  className="w-full rounded-lg px-3 py-2 text-left font-body text-sm text-text hover:bg-pill"
                >
                  {CURRENT_LOCATION_LABEL}
                </button>
              )}
              {trimmed && isSearching && suggestions.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-2 font-body text-xs text-text-faint">
                  <LoadingSpinner className="size-3 text-text-faint" />
                  Searching…
                </div>
              )}
              {trimmed && !isSearching && suggestions.length === 0 && !showCurrentOption && (
                <div className="px-3 py-2 font-body text-xs text-text-faint">No places match that</div>
              )}
              {suggestions.map((location) => (
                <button
                  key={location.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectLocation(location)}
                  className="w-full truncate rounded-lg px-3 py-2 text-left font-body text-sm text-text hover:bg-pill"
                >
                  {location.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        <span className="shrink-0 font-body text-[10px] font-medium uppercase tracking-wide text-text-faint">To</span>
        <span className="min-w-0 flex-1 truncate font-display text-sm text-text-soft">{destination.name}</span>
      </div>
    </div>
  );
}
