import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { HeaderMapScrim } from "@/components/layout/HeaderMapScrim";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { CategoryFilter } from "@/components/filters/CategoryFilter";
import { MapView } from "@/components/map/MapView";
import type { MapMarkerSpec } from "@/hooks/useMapMarkers";
import { LocationPreviewCard } from "@/components/cards/LocationPreviewCard";
import { ViewportLocationCards } from "@/components/cards/ViewportLocationCards";
import { BottomSheet, type SheetSnap } from "@/components/place/BottomSheet";
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
  const [drawerSnap, setDrawerSnap] = useState<SheetSnap>("collapsed");
  const { results, isSearching } = useLocationSearch(query);
  const searching = searchFocused || query.trim().length > 0;

  // Fades the floating header out as the drawer approaches "full" — same
  // pattern as the Place Page, so both drawers feel like the same system.
  const headerOpacity = useMotionValue(1);

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
    <div className="fixed inset-0 overflow-hidden bg-bg">
      {/* Full-bleed map — the same living background the Place Page uses,
          with the location pins layered on top and the card drawer resting
          over it rather than beneath it in its own section. */}
      <MapView
        center={geo.coordinates}
        onBoundsChange={setBounds}
        flyTo={selected?.coordinates}
        flyToToken={flyToToken}
        flyToZoom={15}
        markers={allLocations ? markers : []}
        overlay
      />

      {/* The map continues faintly behind the header — barely visible,
          blended in rather than hard-cropped — instead of a flat opaque
          bar sitting on top of it. Compact and hugging the top safe area
          either way, so there's no blank gap above the title. */}
      <HeaderMapScrim opacity={headerOpacity} />
      <motion.div
        style={{ opacity: headerOpacity }}
        className={clsx(
          "absolute inset-x-0 top-0 z-30 px-6 pt-[max(0.75rem,env(safe-area-inset-top))]",
          drawerSnap === "full" ? "pointer-events-none" : "pointer-events-auto",
        )}
      >
        <Header titleBeforeAccent="Welcome to" interactive={drawerSnap !== "full"} />

        <div className="relative mt-4">
          <SearchBar value={query} onChange={setQuery} onFocusChange={setSearchFocused} />
          <SearchResults
            visible={searching}
            query={query}
            results={results}
            isSearching={isSearching}
            onSelect={goToPlace}
          />
        </div>

        {!searching && (
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
      </motion.div>

      {!searching && (
        <>
          {/* The tapped-pin preview floats just above the drawer, never
              competing with it for the same screen region. */}
          <div className="pointer-events-none absolute inset-x-3 z-25 bottom-[calc(184px+env(safe-area-inset-bottom))]">
            <AnimatePresence>
              {selected && drawerSnap !== "full" && (
                <div className="pointer-events-auto relative">
                  <LocationPreviewCard location={selected} onGo={goToPlace} onDismiss={() => setSelected(null)} />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* The location-card drawer: layered directly over the map like
              the Place Page's detail sheet, rather than a bounded section
              beneath a bounded map card. Collapsed by default so the map
              stays dominant; drag it up to browse what's in view. */}
          <BottomSheet
            snap={drawerSnap}
            onSnapChange={setDrawerSnap}
            onExpansionChange={(expansion) => headerOpacity.set(1 - expansion)}
            peek={
              <div className="flex flex-col gap-3 px-5">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm text-text">In view</p>
                  <p className="font-body text-xs text-text-faint">
                    {viewportLocations.length} {viewportLocations.length === 1 ? "place" : "places"}
                  </p>
                </div>
                <ViewportPreviewStrip locations={viewportLocations} onSelect={goToPlace} />
              </div>
            }
          >
            <div className="h-full px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1">
              {allLocations && allLocations.length === 0 ? (
                <EmptyState
                  title="No places saved yet"
                  description="Places you save will start showing up here, pinned right where they belong."
                />
              ) : (
                <ViewportLocationCards locations={viewportLocations} onSelect={goToPlace} isLoading={!allLocations} />
              )}
            </div>
          </BottomSheet>
        </>
      )}
    </div>
  );
}

/** A compact horizontally-scrolling row of thumbnail chips shown in the
 * drawer's always-visible peek — a small taste of what's in the viewport
 * so the collapsed drawer reads as "there are cards here, pull up" rather
 * than just a bare label. The full cards live in the scrollable body. */
function ViewportPreviewStrip({ locations, onSelect }: { locations: Location[]; onSelect: (location: Location) => void }) {
  if (locations.length === 0) return null;
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
      {locations.slice(0, 10).map((location) => (
        <button
          key={location.id}
          onClick={(event) => {
            // This chip sits inside the sheet's draggable peek header —
            // stop the click from also being read as the start of a drag.
            event.stopPropagation();
            onSelect(location);
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          className="flex shrink-0 items-center gap-2 rounded-full bg-surface-row py-1.5 pl-1.5 pr-3.5"
        >
          <img src={location.image} alt="" loading="lazy" className="size-8 shrink-0 rounded-full object-cover" />
          <span className="max-w-[104px] truncate font-body text-xs text-text">{location.name}</span>
        </button>
      ))}
    </div>
  );
}
