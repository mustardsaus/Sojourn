import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Location } from "@/types/location";
import type { RouteOrigin } from "@/hooks/useRoute";
import { usePlaceSearch, type PlaceResult } from "@/hooks/usePlaceSearch";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface RouteControlsProps {
  origin: RouteOrigin;
  onOriginChange: (origin: RouteOrigin) => void;
  destination: Location;
  savedLocations: Location[];
}

const CURRENT_LOCATION_LABEL = "Your Current Location";
const MAX_SAVED_SUGGESTIONS = 5;

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
 * before; this component just needs to call `onOriginChange`.
 *
 * The search itself draws from two genuinely separate pools, shown as two
 * groups rather than merged into one: Sojourn's own saved locations (a
 * quick way to reuse a place already in the app) and real-world results
 * from `usePlaceSearch` (any address, landmark, neighborhood, or other
 * searchable place — never limited to what's saved here). Picking either
 * kind sets the same `origin`, just a different variant of it. */
export function RouteControls({ origin, onOriginChange, destination, savedLocations }: RouteControlsProps) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { results: placeResults, isSearching, status: placeStatus } = usePlaceSearch(query);

  const originLabel =
    origin.type === "current" ? CURRENT_LOCATION_LABEL : origin.type === "location" ? origin.location.name : origin.place.name;
  const trimmed = query.trim();

  const savedMatches = useMemo(() => {
    const pool = savedLocations.filter((l) => l.id !== destination.id);
    if (!trimmed) return pool.slice(0, 8);
    const needle = trimmed.toLowerCase();
    return pool.filter((l) => l.name.toLowerCase().includes(needle)).slice(0, MAX_SAVED_SUGGESTIONS);
  }, [trimmed, savedLocations, destination.id]);

  const showCurrentOption = !trimmed || CURRENT_LOCATION_LABEL.toLowerCase().includes(trimmed.toLowerCase());
  const showPlaceGroup = trimmed.length > 0;
  const noMatches =
    trimmed.length > 0 && !isSearching && placeStatus !== "error" && savedMatches.length === 0 && placeResults.length === 0 && !showCurrentOption;

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

  function selectPlace(place: PlaceResult) {
    onOriginChange({ type: "place", place });
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
            placeholder="Search any location…"
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
              className="no-scrollbar absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl bg-surface p-1 shadow-card"
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

              {savedMatches.length > 0 && (
                <div className="mt-0.5">
                  {trimmed && (
                    <p className="px-3 pb-1 pt-1.5 font-body text-[10px] font-medium uppercase tracking-wide text-text-faint">
                      Your saved places
                    </p>
                  )}
                  {savedMatches.map((location) => (
                    <button
                      key={location.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectLocation(location)}
                      className="w-full truncate rounded-lg px-3 py-2 text-left font-body text-sm text-text hover:bg-pill"
                    >
                      {location.name}
                    </button>
                  ))}
                </div>
              )}

              {showPlaceGroup && (
                <div className="mt-0.5">
                  <p className="px-3 pb-1 pt-1.5 font-body text-[10px] font-medium uppercase tracking-wide text-text-faint">
                    Search results
                  </p>
                  {isSearching && placeResults.length === 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 font-body text-xs text-text-faint">
                      <LoadingSpinner className="size-3 text-text-faint" />
                      Searching…
                    </div>
                  )}
                  {placeStatus === "error" && (
                    <div className="px-3 py-2 font-body text-xs text-text-faint">
                      Couldn't reach place search — try again
                    </div>
                  )}
                  {placeResults.map((place) => (
                    <button
                      key={place.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectPlace(place)}
                      className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-pill"
                    >
                      <span className="w-full truncate font-body text-sm text-text">{place.name}</span>
                      {place.secondaryLabel && (
                        <span className="w-full truncate font-body text-xs text-text-faint">{place.secondaryLabel}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {noMatches && <div className="px-3 py-2 font-body text-xs text-text-faint">No places match that</div>}
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
