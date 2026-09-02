import { useMemo, useState } from "react";
import type { Coordinates, Location } from "@/types/location";
import { useGeolocation } from "./useGeolocation";
import { distanceKm, estimateTravelMinutes, formatDuration, googleMapsDirectionsUrl } from "@/lib/geo";

export type RouteOrigin = { type: "current" } | { type: "location"; location: Location };

export function useRoute(destination: Location) {
  const [origin, setOrigin] = useState<RouteOrigin>({ type: "current" });
  const geo = useGeolocation();

  const originCoordinates: Coordinates = origin.type === "current" ? geo.coordinates : origin.location.coordinates;

  const km = useMemo(
    () => distanceKm(originCoordinates, destination.coordinates),
    [originCoordinates, destination.coordinates],
  );
  const minutes = estimateTravelMinutes(km);

  const googleMapsUrl = useMemo(() => {
    const originParam = origin.type === "current" ? "Current+Location" : originCoordinates;
    return googleMapsDirectionsUrl(originParam, destination.coordinates);
  }, [origin, originCoordinates, destination.coordinates]);

  return {
    origin,
    setOrigin,
    originCoordinates,
    originIsLive: origin.type === "current" && geo.status === "granted",
    distanceKm: km,
    durationLabel: formatDuration(minutes),
    googleMapsUrl,
  };
}
