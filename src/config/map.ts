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

/** Free, key-less basemaps from CARTO. Chosen so day/night mode gets a
 * genuinely different cartographic style rather than an inverted filter. */
export const TILE_LAYERS = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
    labelsUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png",
    labelsUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
} as const;
