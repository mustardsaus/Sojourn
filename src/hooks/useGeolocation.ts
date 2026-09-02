import { useEffect, useState } from "react";
import type { Coordinates } from "@/types/location";
import { DEFAULT_MAP_CENTER } from "@/config/map";

export type GeolocationStatus = "loading" | "granted" | "denied" | "unavailable";

interface GeolocationState {
  coordinates: Coordinates;
  status: GeolocationStatus;
  /** True once we have a definite answer (granted, denied, or unavailable). */
  isResolved: boolean;
}

/** Centers on the user when possible, and falls back to a sensible
 * default (central Bangalore) without ever leaving the map in limbo. */
export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    coordinates: DEFAULT_MAP_CENTER,
    status: "loading",
    isResolved: false,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState({ coordinates: DEFAULT_MAP_CENTER, status: "unavailable", isResolved: true });
      return;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setState({
          coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude },
          status: "granted",
          isResolved: true,
        });
      },
      () => {
        if (cancelled) return;
        setState({ coordinates: DEFAULT_MAP_CENTER, status: "denied", isResolved: true });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
