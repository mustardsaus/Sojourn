import type { Coordinates } from "@/types/location";

/** Bangalore — center of the sample data set. Used only when geolocation
 * is unavailable or denied. */
export const DEFAULT_MAP_CENTER: Coordinates = {
  latitude: 12.9716,
  longitude: 77.5946,
};

export const DEFAULT_ZOOM = 12;
export const PLACE_ZOOM = 15;

/** Mirrors --color-accent — used where Leaflet path styling needs a real
 * hex value rather than a CSS custom property. */
export const ACCENT_HEX = "#008d2a";

/**
 * Standard OpenStreetMap raster tiles — genuinely free and keyless for a
 * personal-scale app (see https://operations.osmfoundation.org/policies/tiles/).
 * There's only one tile style here; day/night is achieved by filtering the
 * tile pane in CSS (see `.leaflet-tile-pane` rules in index.css) rather
 * than swapping tile sources — CARTO's split "nolabels"/"only_labels"
 * basemaps used previously now require a paid API key, so this avoids
 * depending on any provider's free tier at all.
 */
export const TILE_LAYERS = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
} as const;
