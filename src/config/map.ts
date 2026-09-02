import type { Coordinates } from "@/types/location";

/** Bangalore — center of the sample data set. Used only when geolocation
 * is unavailable or denied. */
export const DEFAULT_MAP_CENTER: Coordinates = {
  latitude: 12.9716,
  longitude: 77.5946,
};

export const DEFAULT_ZOOM = 12;
export const PLACE_ZOOM = 15;

/** Mirrors --color-accent — used where MapLibre paint properties need a
 * real hex value rather than a CSS custom property. */
export const ACCENT_HEX = "#008d2a";
export const ROUTE_CORE_HEX = "#baffb0";
