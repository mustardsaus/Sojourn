import { useEffect, useState } from "react";
import type { Coordinates } from "@/types/location";

export interface PlaceResult {
  /** Stable enough for a React key; not a Sojourn location id. */
  id: string;
  name: string;
  /** The rest of the address/place hierarchy, for disambiguating results
   * that share a name (e.g. two "Koramangala"s). */
  secondaryLabel?: string;
  coordinates: Coordinates;
}

export type PlaceSearchStatus = "idle" | "searching" | "ready" | "error";

const SEARCH_DEBOUNCE_MS = 320;
const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 8;

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
}

function toPlaceResult(raw: NominatimResult): PlaceResult {
  const parts = raw.display_name.split(",").map((part) => part.trim());
  const primary = raw.name?.trim() || parts[0] || raw.display_name;
  const rest = parts[0] === primary ? parts.slice(1) : parts;
  return {
    id: `osm:${raw.place_id}`,
    name: primary,
    secondaryLabel: rest.length > 0 ? rest.join(", ") : undefined,
    coordinates: { latitude: Number.parseFloat(raw.lat), longitude: Number.parseFloat(raw.lon) },
  };
}

/**
 * Real-world place search for the route origin field — any city,
 * neighborhood, landmark, address, restaurant, or other searchable
 * location, not just what's saved in this app. Backed by OpenStreetMap's
 * Nominatim geocoder: free and keyless, same reasoning as the basemap
 * choice (see the earlier switch off key-gated CARTO tiles) rather than
 * wiring up a Google Places API key/billing for this.
 *
 * This is a deliberately separate search from `useLocationSearch` (which
 * only searches Sojourn's own saved locations) — the From field needs
 * both to exist as genuinely different pools, not one restricting the
 * other. Swapping in a different geocoding provider later only means
 * rewriting the fetch below; `PlaceResult` and everything downstream
 * (the route origin, road routing) stays the same.
 *
 * Note for production hardening: Nominatim's usage policy caps this at
 * roughly one request/second and asks for referrer or User-Agent
 * identification — the debounce below keeps a single user well under
 * that limit, and a browser's own Referer header satisfies the policy for
 * client-side use, but meaningful traffic should proxy through a small
 * backend instead of calling Nominatim directly from the client.
 */
export function usePlaceSearch(query: string) {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [status, setStatus] = useState<PlaceSearchStatus>("idle");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setStatus("searching");

    const handle = setTimeout(() => {
      const url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&limit=${RESULT_LIMIT}` +
        `&q=${encodeURIComponent(trimmed)}`;

      fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } })
        .then((res) => {
          if (!res.ok) throw new Error(`place search failed (${res.status})`);
          return res.json() as Promise<NominatimResult[]>;
        })
        .then((data) => {
          if (cancelled) return;
          setResults(data.map(toPlaceResult));
          setStatus("ready");
        })
        .catch((error: unknown) => {
          if (cancelled || (error as { name?: string })?.name === "AbortError") return;
          setResults([]);
          setStatus("error");
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
      controller.abort();
    };
  }, [query]);

  return { results, status, isSearching: status === "searching" };
}
