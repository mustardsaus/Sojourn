import type { Location, LocationImage } from "@/types/location";

/** The one place that decides "which image represents this location" —
 * prefers the flagged thumbnail, falls back to whichever sorts first by
 * `order`, and never assumes array position means anything on its own. */
export function getThumbnailImage(images: LocationImage[]): LocationImage | undefined {
  if (images.length === 0) return undefined;
  return images.find((image) => image.isThumbnail) ?? [...images].sort((a, b) => a.order - b.order)[0];
}

/** Convenience for the many call sites that just want a URL for an `<img>`
 * — dashboard cards, search results, preview chips, anywhere a location
 * needs a single compact visual regardless of how many photos it has. */
export function getThumbnailUrl(location: Pick<Location, "images">): string {
  return getThumbnailImage(location.images)?.url ?? "";
}

export function sortImagesByOrder(images: LocationImage[]): LocationImage[] {
  return [...images].sort((a, b) => a.order - b.order);
}
