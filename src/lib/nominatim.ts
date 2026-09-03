import type { Coordinates } from "@/types/location";

/** Shared with `usePlaceSearch.ts` only by shape, not by import — that hook
 * already has its own working fetch/debounce lifecycle and there's no need
 * to risk it for this. This module is for one-shot lookups: resolve a
 * single free-text query to a single best-guess point, no live suggestion
 * list involved. Same keyless Nominatim reasoning as everywhere else in the
 * app (see `usePlaceSearch.ts`) — no API key, no billing account, same
 * client-side call. */
interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
}

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

/** Resolves a free-text place name/query to coordinates — used as the
 * Contribute form's fallback when a Google Maps link only carries a place
 * name (no embedded lat/lng) rather than a live search. Returns `null` when
 * nothing matches; throws only on a genuine network/HTTP failure so the
 * caller can tell "no such place" apart from "couldn't reach the server". */
export async function geocodePlaceName(query: string): Promise<Coordinates | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = `${NOMINATIM_SEARCH_URL}?format=jsonv2&addressdetails=0&limit=1&q=${encodeURIComponent(trimmed)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`geocode failed (${res.status})`);

  const results = (await res.json()) as NominatimResult[];
  const [first] = results;
  if (!first) return null;

  const latitude = Number.parseFloat(first.lat);
  const longitude = Number.parseFloat(first.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}
