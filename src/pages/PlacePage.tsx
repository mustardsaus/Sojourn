import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, useMotionValue } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { RouteControls } from "@/components/place/RouteControls";
import { RouteMap } from "@/components/place/RouteMap";
import { PlaceDetailCard } from "@/components/place/PlaceDetailCard";
import { BottomSheet, type SheetSnap } from "@/components/place/BottomSheet";
import { AdiScoreStars } from "@/components/common/AdiScore";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useRoute } from "@/hooks/useRoute";
import { locationRepository } from "@/data/repository";
import { getCategoryConfig, getSecondLevelLabel } from "@/config/categories";
import type { Location } from "@/types/location";

export function PlacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [location, setLocation] = useState<Location | null | undefined>(undefined);
  const [allLocations, setAllLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (!id) return;
    setLocation(undefined);
    locationRepository.getById(id).then((result) => setLocation(result ?? null));
  }, [id]);

  useEffect(() => {
    locationRepository.getAll().then(setAllLocations);
  }, []);

  if (location === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <LoadingSpinner className="size-6 text-accent" />
      </div>
    );
  }

  if (location === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6">
        <EmptyState title="We couldn't find that place" description="It may have been removed, or the link is off." />
        <button
          onClick={() => navigate("/")}
          className="rounded-[10px] border border-accent-soft bg-accent px-5 py-2.5 font-display text-xs text-white"
        >
          Back to the map
        </button>
      </div>
    );
  }

  return <PlacePageContent location={location} allLocations={allLocations} />;
}

function PlacePageContent({ location, allLocations }: { location: Location; allLocations: Location[] }) {
  const route = useRoute(location);
  const [snap, setSnap] = useState<SheetSnap>("partial");
  const categoryLabel = getCategoryConfig(location.topLevelCategory).label;
  const secondLabel = getSecondLevelLabel(location.topLevelCategory, location.secondLevelCategory);

  // Fades the floating header out as the drawer approaches "full" — by the
  // time it gets there the drawer occupies the same screen region the
  // header floats over, so left at full opacity the two visually collide.
  // A motion value (rather than state) so the fade tracks the drag itself
  // frame-by-frame without re-rendering this component on every tick.
  const headerOpacity = useMotionValue(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className="fixed inset-0 overflow-hidden bg-bg"
    >
      {/* Full-screen map — the route is the primary geographic element,
          visible behind the drawer at every snap state. */}
      <RouteMap
        origin={route.origin}
        originCoordinates={route.originCoordinates}
        destination={location}
        route={route.routeGeometry}
        className="absolute inset-0"
      />

      {/* A soft top scrim keeps the floating header legible over whatever
          the map happens to show underneath it, without a hard bar. */}
      <motion.div
        style={{ opacity: headerOpacity }}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-bg via-bg/60 to-transparent"
      />
      <motion.div
        style={{ opacity: headerOpacity }}
        className="pointer-events-none absolute inset-x-0 top-0 z-30 px-6 pt-[max(2rem,env(safe-area-inset-top))]"
      >
        <Header titleBeforeAccent="Plotting your" interactive={snap !== "full"} />
      </motion.div>

      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        onExpansionChange={(expansion) => headerOpacity.set(1 - expansion)}
        peek={
          <div className="flex items-start justify-between gap-3 px-5">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-lg text-text">{location.name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-accent text-xs font-medium text-text-soft">
                  {categoryLabel} | {secondLabel}
                </span>
                <AdiScoreStars score={location.adiScore} />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="font-display text-xs text-text-soft">
                {route.durationLabel} · {route.distanceKm.toFixed(1)} km
              </span>
              <a
                href={route.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                // Stops the sheet's own drag tracking (mousedown/touchstart
                // on the peek div this sits inside) from also starting when
                // someone just means to tap this CTA.
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                className="flex items-center gap-1.5 rounded-full border border-accent-soft bg-accent px-3.5 py-1.5 font-display text-xs text-white shadow-sm transition-transform active:scale-95"
              >
                Open in Maps
                <ExternalIcon />
              </a>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4 px-5 pt-3 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <RouteControls
            origin={route.origin}
            onOriginChange={route.setOrigin}
            destination={location}
            savedLocations={allLocations}
          />
          <PlaceDetailCard location={location} hideHeader />
        </div>
      </BottomSheet>
    </motion.div>
  );
}

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 17L17 7M17 7H9M17 7v8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
