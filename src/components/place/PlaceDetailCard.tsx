import { useState } from "react";
import clsx from "clsx";
import { getCategoryColor, getCategoryConfig, getSecondLevelLabel } from "@/config/categories";
import { AdiScoreStars } from "@/components/common/AdiScore";
import { ThreeDViewer } from "@/components/three/ThreeDViewer";
import { MediaGallery } from "./MediaGallery";
import { NotesField } from "./NotesField";
import { ItinerariesSection } from "./ItinerariesSection";
import type { Location } from "@/types/location";

interface PlaceDetailCardProps {
  location: Location;
  /** Skip the colored name/category/rating banner — used inside the Place
   * Page's bottom sheet, where that same information already lives in the
   * sheet's always-visible peek header. */
  hideHeader?: boolean;
}

export function PlaceDetailCard({ location, hideHeader }: PlaceDetailCardProps) {
  const [show3D, setShow3D] = useState(false);
  const color = getCategoryColor(location.topLevelCategory);
  const categoryLabel = getCategoryConfig(location.topLevelCategory).label;
  const secondLabel = getSecondLevelLabel(location.topLevelCategory, location.secondLevelCategory);
  const has3D = location.threeDAsset.kind !== "none";

  return (
    <article
      className={clsx(
        "flex flex-col gap-[18px] overflow-hidden pb-5",
        hideHeader ? "" : "rounded-[10px] bg-surface shadow-card",
      )}
    >
      {!hideHeader && (
        <header className="flex flex-col gap-1 rounded-t-[8px] px-5 py-[10px]" style={{ backgroundColor: color }}>
          <h2 className="font-display text-xl text-white">{location.name}</h2>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <span className="font-accent text-xs">
              {categoryLabel} | {secondLabel}
            </span>
            <AdiScoreStars score={location.adiScore} />
          </div>
        </header>
      )}

      <div
        className={clsx(
          "relative w-full transition-[height] duration-300",
          show3D && has3D ? "h-[340px]" : "h-[190px]",
          hideHeader && "mt-[2px] overflow-hidden rounded-[10px]",
        )}
      >
        {has3D && (
          <button
            onClick={() => setShow3D((v) => !v)}
            className="absolute right-3 top-3 z-10 rounded-full bg-scrim px-3 py-1.5 font-accent text-[10px] font-medium text-text backdrop-blur-sm transition-transform active:scale-95"
          >
            {show3D ? "Show photo" : "View in 3D"}
          </button>
        )}
        {show3D && has3D ? (
          <ThreeDViewer asset={location.threeDAsset} seed={location.id} className="size-full" />
        ) : (
          <MediaGallery images={location.images} name={location.name} className="size-full" />
        )}
      </div>

      {location.description && (
        <p className="px-5 font-body text-sm leading-relaxed text-text-soft">{location.description}</p>
      )}

      <NotesField location={location} />

      <div className="h-px w-full bg-line" />

      <ItinerariesSection locationId={location.id} />
    </article>
  );
}
