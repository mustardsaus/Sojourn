import { useEffect, useState } from "react";
import type { Coordinates } from "@/types/location";

export interface RoadRoute {
  /** [lng, lat] pairs, ready to hand straight to a MapLibre GeoJSON source. */
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

export type RoadRouteStatus = "loading" | "ready" | "error";

/**
 * Real road-network routing via OSRM's public demo server — free and
 * keyless, which matters after CARTO's basemaps taught us not to depend
 * on undocumented free tiers. It's a shared demo instance (not meant for
 * heavy production traffic), so on failure or while it's loading, callers
 * should fall back to a straight-line estimate rather than show nothing.
 * Swapping in a paid routing provider later means changing only this file.
 */
export function useRoadRoute(origin: Coordinates, destination: Coordinates) {
  const [route, setRoute] = useState<RoadRoute | null>(null);
  const [status, setStatus] = useState<RoadRouteStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
      `?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`routing request failed (${res.status})`);
        return res.json();
      })
      .then((data: { routes?: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }[] }) => {
        if (cancelled) return;
        const leg = data.routes?.[0];
        if (!leg) throw new Error("no route returned");
        setRoute({
          coordinates: leg.geometry.coordinates,
          distanceKm: leg.distance / 1000,
          durationMinutes: Math.max(1, Math.round(leg.duration / 60)),
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setRoute(null);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [origin.latitude, origin.longitude, destination.latitude, destination.longitude]);

  return { route, status };
}
