import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
// MapLibre resolves its worker script relative to its own module URL at
// runtime, which breaks once Vite inlines it into our bundle (the request
// ends up pointed at a file that was never emitted). `?worker&url` tells
// Vite to actually bundle the file as a worker entry point (resolving and
// inlining its own internal imports, e.g. the shared chunk it splits off
// by default) and hand back the URL of that self-contained output —
// plain `?url` just copies the raw file, which left its `import` of
// maplibre-gl-shared.mjs dangling since that chunk was never emitted.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { Feature, LineString } from "geojson";
import { useAppStore } from "@/store/useAppStore";
import { DEFAULT_ZOOM } from "@/config/map";
import { buildMapStyle, applyMapTheme, applyRouteTheme, ROUTE_HEX, type MapThemeName } from "@/config/mapStyle";
import { useMapMarkers, type MapMarkerSpec } from "@/hooks/useMapMarkers";
import type { Coordinates } from "@/types/location";
import type { MapBounds } from "@/lib/geo";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

interface MapViewProps {
  center: Coordinates;
  zoom?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
  /** Bumping this value (alongside a new `flyTo` target) triggers a pan/zoom. */
  flyToToken?: number;
  flyTo?: Coordinates;
  flyToZoom?: number;
  markers?: MapMarkerSpec[];
  /** [lng, lat] pairs of an actual road route to draw with the glow treatment. */
  route?: [number, number][] | null;
  /** Recomputes and animates to bounds covering these points (e.g. a route's endpoints). */
  fitBoundsTo?: Coordinates[];
  className?: string;
  interactive?: boolean;
}

const ROUTE_SOURCE_ID = "route";
const ROUTE_LAYERS = {
  outerGlow: "route-glow-outer",
  innerGlow: "route-glow-inner",
  core: "route-core",
};

function toBounds(bounds: maplibregl.LngLatBounds): MapBounds {
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
}

function emptyGeoJSON(): Feature<LineString> {
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } };
}

export function MapView({
  center,
  zoom = DEFAULT_ZOOM,
  onBoundsChange,
  flyToToken,
  flyTo,
  flyToZoom,
  markers,
  route,
  fitBoundsTo,
  className,
  interactive = true,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const theme = useAppStore((s) => s.theme);

  // Callbacks change identity every render; keep the live one in a ref so
  // the map-init effect below can stay mount-only.
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyle(useAppStore.getState().theme === "dark" ? "dark" : "light"),
      center: [center.longitude, center.latitude],
      zoom,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      dragPan: interactive,
      scrollZoom: interactive,
      touchZoomRotate: interactive,
      doubleClickZoom: interactive,
      keyboard: interactive,
    });
    instance.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    instance.touchZoomRotate.disableRotation();

    const handleMoveEnd = () => onBoundsChangeRef.current?.(toBounds(instance.getBounds()));
    instance.on("moveend", handleMoveEnd);
    instance.on("load", () => {
      handleMoveEnd();
      setMap(instance);
    });

    mapRef.current = instance;
    return () => {
      instance.remove();
      mapRef.current = null;
      setMap(null);
    };
    // Intentionally mount-only: center/zoom below are just the initial
    // camera, and `interactive` doesn't change for a mounted MapView.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme: recolor in place rather than rebuilding the style.
  useEffect(() => {
    if (!map) return;
    const resolved = theme === "dark" ? "dark" : "light";
    applyMapTheme(map, resolved);
    applyRouteTheme(map, resolved, Object.values(ROUTE_LAYERS));
  }, [map, theme]);

  useAmbientDrift(map);

  // Imperative pan/zoom on demand (pin tap, search select, etc).
  useEffect(() => {
    if (!map || !flyTo) return;
    map.flyTo({ center: [flyTo.longitude, flyTo.latitude], zoom: flyToZoom ?? map.getZoom(), duration: 1100, essential: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, flyToToken]);

  // Fit to a set of points (e.g. a route's endpoints/geometry).
  useEffect(() => {
    if (!map || !fitBoundsTo || fitBoundsTo.length === 0) return;
    const bounds = fitBoundsTo.reduce(
      (acc, c) => acc.extend([c.longitude, c.latitude]),
      new maplibregl.LngLatBounds([fitBoundsTo[0].longitude, fitBoundsTo[0].latitude], [fitBoundsTo[0].longitude, fitBoundsTo[0].latitude]),
    );
    map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(fitBoundsTo)]);

  useMapMarkers(map, markers ?? []);
  useRouteLayer(map, route ?? null, theme === "dark" ? "dark" : "light");

  return (
    <div ref={containerRef} className={`map-surface ${className ?? "size-full"}`}>
      <div className="map-vignette" />
    </div>
  );
}

/** Draws the road route (when present) as a three-pass glow — a wide
 * blurred halo, a tighter mid glow, and a bright core — with a slow
 * breathing pulse. Respects prefers-reduced-motion by holding a static
 * (still glowing) line instead of animating. Colored per theme (strong
 * near-black in day mode, strong white in dark mode) — never green — so
 * it's the clear standout element against the much softer road network. */
function useRouteLayer(map: maplibregl.Map | null, route: [number, number][] | null, theme: MapThemeName) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!map.getSource(ROUTE_SOURCE_ID)) {
      const routeHex = ROUTE_HEX[theme];
      map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: emptyGeoJSON() });
      map.addLayer({
        id: ROUTE_LAYERS.outerGlow,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": routeHex,
          "line-width": 16,
          "line-blur": 14,
          "line-opacity": 0.22,
        },
      });
      map.addLayer({
        id: ROUTE_LAYERS.innerGlow,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": routeHex,
          "line-width": 8,
          "line-blur": 5,
          "line-opacity": 0.5,
        },
      });
      map.addLayer({
        id: ROUTE_LAYERS.core,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": routeHex,
          "line-width": 3,
          "line-opacity": 0.95,
        },
      });
    }

    const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    source?.setData(
      route
        ? { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route } }
        : emptyGeoJSON(),
    );

    const visibility = route ? "visible" : "none";
    for (const id of Object.values(ROUTE_LAYERS)) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!route || reduceMotion) return;

    const start = performance.now();
    let lastPaint = 0;
    const tick = (now: number) => {
      if (now - lastPaint > 60) {
        lastPaint = now;
        const t = (now - start) / 1000;
        const pulse = (Math.sin(t * 1.4) + 1) / 2; // 0..1
        if (map.getLayer(ROUTE_LAYERS.outerGlow)) {
          map.setPaintProperty(ROUTE_LAYERS.outerGlow, "line-width", 14 + pulse * 6);
          map.setPaintProperty(ROUTE_LAYERS.outerGlow, "line-opacity", 0.16 + pulse * 0.14);
        }
        if (map.getLayer(ROUTE_LAYERS.innerGlow)) {
          map.setPaintProperty(ROUTE_LAYERS.innerGlow, "line-opacity", 0.4 + pulse * 0.25);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // `theme` intentionally excluded: it only seeds color at first layer
    // creation — later theme changes are handled by `applyRouteTheme`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route]);
}

/** A very subtle, cinematic idle sway of the map's bearing around its own
 * center — alive but never disorienting — that starts as soon as the map
 * is ready and stops for good at the first sign of user interaction.
 * Skipped entirely under prefers-reduced-motion. */
function useAmbientDrift(map: maplibregl.Map | null) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = true;
    const stop = () => {
      if (!active) return;
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    const interactionEvents = [
      "dragstart",
      "zoomstart",
      "rotatestart",
      "pitchstart",
      "wheel",
      "touchstart",
      "mousedown",
    ] as const;
    interactionEvents.forEach((event) => map.on(event, stop));

    const start = performance.now();
    const PERIOD_SECONDS = 18;
    const AMPLITUDE_DEGREES = 3;
    const tick = (now: number) => {
      if (!active) return;
      const t = (now - start) / 1000;
      map.setBearing(Math.sin((t / PERIOD_SECONDS) * Math.PI * 2) * AMPLITUDE_DEGREES);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      interactionEvents.forEach((event) => map.off(event, stop));
    };
  }, [map]);
}
