import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { CategoryFilter } from "@/components/filters/CategoryFilter";
import { MapView } from "@/components/map/MapView";
import type { MapMarkerSpec } from "@/hooks/useMapMarkers";
import { LocationPreviewCard } from "@/components/cards/LocationPreviewCard";
import { ViewportLocationCards } from "@/components/cards/ViewportLocationCards";
import { MapLoadingOverlay } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { useAppStore } from "@/store/useAppStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { locationRepository } from "@/data/repository";
import { filterByBounds, type MapBounds } from "@/lib/geo";
import type { Location } from "@/types/location";

export function Dashboard() {
  const navigate = useNavigate();
  const activeFilter = useAppStore((s) => s.activeFilter);
  const setActiveFilter = useAppStore((s) => s.setActiveFilter);
  const geo = useGeolocation();

  const [allLocations, setAllLocations] = useState<Location[] | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selected, setSelected] = useState<Location | null>(null);
  const [flyToToken, setFlyToToken] = useState(0);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { results, isSearching } = useLocationSearch(query);

  useEffect(() => {
    locationRepository.getAll().then(setAllLocations);
  }, []);

  function selectLocation(location: Location) {
    setSelected(location);
    setFlyToToken((token) => token + 1);
  }

  const filteredLocations = useMemo(() => {
    if (!allLocations) return [];
    if (activeFilter === "all") return allLocations;
    return allLocations.filter((l) => l.topLevelCategory === activeFilter);
  }, [allLocations, activeFilter]);

  const viewportLocations = useMemo(
    () => filterByBounds(filteredLocations, bounds),
    [filteredLocations, bounds],
  );

  const markers = useMemo<MapMarkerSpec[]>(() => {
    const pins: MapMarkerSpec[] = filteredLocations.map((location) => ({
      id: location.id,
      coordinates: location.coordinates,
      kind: "category",
      category: location.topLevelCategory,
      active: location.id === selected?.id,
      onClick: () => selectLocation(location),
    }));
    if (geo.status === "granted") {
      pins.push({ id: "__you__", coordinates: geo.coordinates, kind: "you" });
    }
    return pins;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLocations, selected?.id, geo.status, geo.coordinates]);

  function goToPlace(location: Location) {
    navigate(`/place/${location.id}`);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-bg pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="px-6 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <Header titleBeforeAccent="Welcome to" />

        <div className="relative mt-6">
          <SearchBar value={query} onChange={setQuery} onFocusChange={setSearchFocused} />
          <SearchResults
            visible={searchFocused || query.trim().length > 0}
            query={query}
            results={results}
            isSearching={isSearching}
            onSelect={goToPlace}
          />
        </div>

        {!(searchFocused || query.trim().length > 0) && (
          <>
            <CategoryFilter value={activeFilter} onChange={setActiveFilter} className="mt-4" />
            <button
              onClick={() => navigate("/contribute")}
              className="mt-4 font-display text-xs text-text underline decoration-text-faint decoration-dotted underline-offset-4"
            >
              Contribute?
            </button>
          </>
        )}
      </div>

      {!(searchFocused || query.trim().length > 0) && (
        <div className="mt-4 flex flex-1 flex-col gap-4 px-6">
          <div className="relative h-[400px] shrink-0 overflow-hidden rounded-[14px]">
            {!allLocations && <MapLoadingOverlay />}
            <MapView
              center={geo.coordinates}
              onBoundsChange={setBounds}
              flyTo={selected?.coordinates}
              flyToToken={flyToToken}
              flyToZoom={15}
              markers={allLocations ? markers : []}
            />

            <div className="pointer-events-none absolute inset-x-3 bottom-3">
              <AnimatePresence>
                {selected && (
                  <div className="pointer-events-auto relative">
                    <LocationPreviewCard location={selected} onGo={goToPlace} onDismiss={() => setSelected(null)} />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div layout className="min-h-[220px] flex-1">
            {allLocations && allLocations.length === 0 ? (
              <EmptyState
                title="No places saved yet"
                description="Places you save will start showing up here, pinned right where they belong."
              />
            ) : (
              <ViewportLocationCards
                locations={viewportLocations}
                onSelect={goToPlace}
                isLoading={!allLocations}
              />
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
