import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { Header } from "@/components/layout/Header";
import { HeaderMapScrim } from "@/components/layout/HeaderMapScrim";
import { RouteControls } from "@/components/place/RouteControls";
import { RouteMap } from "@/components/place/RouteMap";
import { MapRevealVeil } from "@/components/map/MapRevealVeil";
import { PlaceDetailCard } from "@/components/place/PlaceDetailCard";
import { BottomSheet, type SheetSnap } from "@/components/place/BottomSheet";
import { AdiScoreStars } from "@/components/common/AdiScore";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useRoute } from "@/hooks/useRoute";
import { locationRepository } from "@/data/repository";
import { getCategoryConfig, getSecondLevelLabel } from "@/config/categories";
import type { Location } from "@/types/location";
import { hasIntroPlayed, markIntroPlayed } from "@/lib/introFlag";
import {
  introItemVariants,
  introItemVariantsDelayed,
  introItemVariantsReduced,
  introItemVariantsReducedDelayed,
} from "@/lib/introMotion";

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

  // Cinematic first-load sequence — see the matching comment in
  // Dashboard.tsx. This also covers the (rarer) case of someone landing
  // directly on a place URL as their actual first load of the app; on
  // ordinary navigation from the dashboard, `playIntro` is already false
  // by the time this mounts, so none of this renders.
  const [playIntro] = useState(() => !hasIntroPlayed());
  const prefersReducedMotion = useReducedMotion();
  const [uiRevealed, setUiRevealed] = useState(false);
  const headerVariants = prefersReducedMotion ? introItemVariantsReduced : introItemVariants;
  const drawerVariants = prefersReducedMotion ? introItemVariantsReducedDelayed : introItemVariantsDelayed;

  useEffect(() => {
    if (playIntro) markIntroPlayed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        overlay
      />

      <MapRevealVeil active={playIntro} onDone={() => setUiRevealed(true)} />

      {/* The map continues faintly behind the header — barely visible,
          blended in rather than hard-cropped — instead of a flat opaque
          bar sitting on top of it. Compact and hugging the top safe area
          either way, so there's no blank gap above the title. */}
      <HeaderMapScrim opacity={headerOpacity} />
      {playIntro ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30"
          initial="hidden"
          animate={uiRevealed ? "visible" : "hidden"}
          variants={headerVariants}
        >
          {headerBlockContent()}
        </motion.div>
      ) : (
        headerBlockContent()
      )}

      {playIntro ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20"
          initial="hidden"
          animate={uiRevealed ? "visible" : "hidden"}
          variants={drawerVariants}
        >
          {drawerBlockContent()}
        </motion.div>
      ) : (
        drawerBlockContent()
      )}
    </motion.div>
  );

  function headerBlockContent() {
    return (
      <motion.div
        style={{ opacity: headerOpacity }}
        className={clsx(
          "absolute inset-x-0 top-0 z-30 px-6 pt-[max(0.75rem,env(safe-area-inset-top))]",
          snap === "full" ? "pointer-events-none" : "pointer-events-auto",
        )}
      >
        <Header titleBeforeAccent="Plotting your" interactive={snap !== "full"} />
        <div className="mt-3">
          <RouteControls
            origin={route.origin}
            onOriginChange={route.setOrigin}
            destination={location}
            savedLocations={allLocations}
          />
        </div>
      </motion.div>
    );
  }

  function drawerBlockContent() {
    return (
      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        onExpansionChange={(expansion) => headerOpacity.set(1 - expansion)}
        className="pointer-events-auto"
        peek={
          <div className="flex items-start justify-between gap-3 px-5">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-xl text-text">{location.name}</h2>
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
          <PlaceDetailCard location={location} hideHeader />
        </div>
      </BottomSheet>
    );
  }
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
