import { useEffect, useState } from "react";
import { parseGoogleMapsLink } from "@/lib/googleMapsLink";
import { geocodePlaceName } from "@/lib/nominatim";
import type { Coordinates } from "@/types/location";

export type LinkResolutionStatus = "idle" | "resolving" | "resolved" | "error";

const DEBOUNCE_MS = 450;

/**
 * Turns a pasted Google Maps link into coordinates: parses it client-side
 * first (see `parseGoogleMapsLink`), and only reaches for the network when
 * the link carries a place name but no embedded coordinates. Debounced so a
 * paste (which fires several onChange events in quick succession in some
 * browsers) doesn't kick off redundant geocode requests.
 */
export function useGoogleMapsLinkResolver(url: string) {
  const [status, setStatus] = useState<LinkResolutionStatus>("idle");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setStatus("idle");
      setCoordinates(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setStatus("resolving");
    setError(null);

    const handle = setTimeout(() => {
      const parsed = parseGoogleMapsLink(trimmed);

      if (parsed.status === "coordinates") {
        if (cancelled) return;
        setCoordinates(parsed.coordinates);
        setStatus("resolved");
        return;
      }

      if (parsed.status === "unresolvable") {
        if (cancelled) return;
        setCoordinates(null);
        setStatus("error");
        setError(parsed.reason);
        return;
      }

      geocodePlaceName(parsed.placeNameHint)
        .then((coords) => {
          if (cancelled) return;
          if (coords) {
            setCoordinates(coords);
            setStatus("resolved");
          } else {
            setCoordinates(null);
            setStatus("error");
            setError("Couldn't find that place — try a different link.");
          }
        })
        .catch(() => {
          if (cancelled) return;
          setCoordinates(null);
          setStatus("error");
          setError("Couldn't reach place search — try again.");
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [url]);

  return { status, coordinates, error };
}
