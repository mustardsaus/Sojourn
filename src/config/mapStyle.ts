import type { StyleSpecification } from "maplibre-gl";

/**
 * OpenFreeMap's planet vector tiles — free, unlimited, no API key
 * (https://openfreemap.org). We don't use any of their ready-made styles;
 * instead we build a minimal style from scratch against the raw
 * OpenMapTiles-schema source, keeping only road geometry and a flat
 * background. No landcover/water/buildings/parks and no symbol layers at
 * all, so there is nothing to remove later — no labels, no icons, no
 * provider watermark baked into a raster tile.
 */
const SOURCE_URL = "https://tiles.openfreemap.org/planet";
const SOURCE_ID = "ofm";
const LAYER_SOURCE = "transportation";

export type MapThemeName = "light" | "dark";

interface RoadPalette {
  background: string;
  major: string;
  secondary: string;
  minor: string;
}

export const ROAD_PALETTES: Record<MapThemeName, RoadPalette> = {
  light: {
    background: "#ffffff",
    major: "#1c1c1c",
    secondary: "#4a4a4a",
    minor: "#a8a8a8",
  },
  dark: {
    background: "#141414",
    major: "#f2f2f0",
    secondary: "#b8b8bd",
    minor: "#57575e",
  },
};

const MAJOR_CLASSES = ["motorway", "trunk"];
const SECONDARY_CLASSES = ["primary", "secondary", "tertiary"];
const MINOR_CLASSES = ["minor", "service", "track", "unclassified", "residential"];

export const ROAD_LAYER_IDS = {
  minor: "roads-minor",
  secondary: "roads-secondary",
  major: "roads-major",
} as const;

/** Builds the full style once at map init. Theme changes afterward are
 * applied via `applyMapTheme` (setPaintProperty), not by rebuilding this —
 * swapping the whole style causes a visible reload/flash. */
export function buildMapStyle(theme: MapThemeName): StyleSpecification {
  const palette = ROAD_PALETTES[theme];

  return {
    version: 8,
    sources: {
      [SOURCE_ID]: {
        type: "vector",
        url: SOURCE_URL,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": palette.background },
      },
      {
        id: ROAD_LAYER_IDS.minor,
        type: "line",
        source: SOURCE_ID,
        "source-layer": LAYER_SOURCE,
        filter: ["in", ["get", "class"], ["literal", MINOR_CLASSES]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": palette.minor,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.3, 15, 1, 18, 2.4],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.4, 14, 0.85],
        },
      },
      {
        id: ROAD_LAYER_IDS.secondary,
        type: "line",
        source: SOURCE_ID,
        "source-layer": LAYER_SOURCE,
        filter: ["in", ["get", "class"], ["literal", SECONDARY_CLASSES]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": palette.secondary,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 13, 1.6, 18, 4],
        },
      },
      {
        id: ROAD_LAYER_IDS.major,
        type: "line",
        source: SOURCE_ID,
        "source-layer": LAYER_SOURCE,
        filter: ["in", ["get", "class"], ["literal", MAJOR_CLASSES]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": palette.major,
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 12, 2.2, 18, 5.5],
        },
      },
    ],
  } satisfies StyleSpecification;
}

/** Cheap theme switch: recolor the existing layers in place instead of
 * reloading the whole style/source. */
export function applyMapTheme(map: import("maplibre-gl").Map, theme: MapThemeName) {
  const palette = ROAD_PALETTES[theme];
  if (!map.getLayer("background")) return;
  map.setPaintProperty("background", "background-color", palette.background);
  map.setPaintProperty(ROAD_LAYER_IDS.minor, "line-color", palette.minor);
  map.setPaintProperty(ROAD_LAYER_IDS.secondary, "line-color", palette.secondary);
  map.setPaintProperty(ROAD_LAYER_IDS.major, "line-color", palette.major);
}
