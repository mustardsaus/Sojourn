import { useMemo, useState } from "react";
import type { Coordinates, Location } from "@/types/location";
import { useGeolocation } from "./useGeolocation";
import { useRoadRoute } from "./useRoadRoute";
import type { PlaceResult } from "./usePlaceSearch";
import { distanceKm, estimateTravelMinutes, formatDuration, googleMapsDirectionsUrl } from "@/lib/geo";

/** Three distinct ways a route can start: the device's live position, one
 * of Sojourn's own saved locations, or an arbitrary real-world place found
 * via `usePlaceSearch` (any address, landmark, or POI — not limited to
 * what's saved in the app). All three ultimately just need to resolve to
 * coordinates below; nothing downstream (road routing, distance/time)
 * cares which kind it is. */
export type RouteOrigin =
  | { type: "current" }
  | { type: "location"; location: Location }
  | { type: "place"; place: PlaceResult };

export function useRoute(destination: Location) {
  const [origin, setOrigin] = useState<RouteOrigin>({ type: "current" });
  const geo = useGeolocation();

  const originCoordinates: Coordinates =
    origin.type === "current"
      ? geo.coordinates
      : origin.type === "location"
        ? origin.location.coordinates
        : origin.place.coordinates;

  const { route, status } = useRoadRoute(originCoordinates, destination.coordinates);

  // While the real road route is loading (or if OSRM's shared demo server
  // is unreachable), fall back to a straight-line estimate so the UI never
  // shows nothing — but the map only ever draws the actual road geometry
  // once it's ready, never the straight line.
  const straightLineKm = useMemo(
    () => distanceKm(originCoordinates, destination.coordinates),
    [originCoordinates, destination.coordinates],
  );

  const distanceKmValue = route?.distanceKm ?? straightLineKm;
  const durationMinutes = route?.durationMinutes ?? estimateTravelMinutes(straightLineKm);

  const googleMapsUrl = useMemo(() => {
    const originParam = origin.type === "current" ? "Current+Location" : originCoordinates;
    return googleMapsDirectionsUrl(originParam, destination.coordinates);
  }, [origin, originCoordinates, destination.coordinates]);

  return {
    origin,
    setOrigin,
    originCoordinates,
    originIsLive: origin.type === "current" && geo.status === "granted",
    routeGeometry: route?.coordinates ?? null,
    routeStatus: status,
    distanceKm: distanceKmValue,
    durationLabel: formatDuration(durationMinutes),
    googleMapsUrl,
  };
}
