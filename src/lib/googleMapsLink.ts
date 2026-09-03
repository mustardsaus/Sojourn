import type { Coordinates } from "@/types/location";

export type GoogleMapsLinkParseResult =
  | { status: "coordinates"; coordinates: Coordinates }
  | { status: "needs-geocode"; placeNameHint: string }
  | { status: "unresolvable"; reason: string };

/** Checked in priority order: `!3d..!4d..` is the actual pin Google Maps
 * resolved a place to (present on `/maps/place/...` URLs), which is more
 * precise than `@lat,lng`, the viewport *center* the map happened to be
 * showing — a place near the edge of the visible map would otherwise
 * resolve to the wrong point. The rest cover the other common link shapes
 * (a bare pin drop, a directions link). */
const COORD_PATTERNS: RegExp[] = [
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /[?&]destination=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
];

const SHORT_LINK_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

function isGoogleMapsHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "");
  return host === "google.com" || host === "maps.google.com" || SHORT_LINK_HOSTS.has(host);
}

function extractPlaceNameHint(url: URL): string | undefined {
  const match = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (!match) return undefined;
  const decoded = decodeURIComponent(match[1].replace(/\+/g, " ")).trim();
  return decoded.length > 0 ? decoded : undefined;
}

/**
 * Reads a Google Maps URL client-side, no network call, no API key. Long-
 * form Maps links (the ones with `@lat,lng` or `!3d!4d` embedded) resolve
 * instantly this way. Short links (`maps.app.goo.gl/...`) genuinely can't
 * be resolved from the browser — Google's redirect response carries no
 * CORS header, so a `fetch` can't read where it points, only that it
 * points somewhere — so those are reported as `unresolvable` with guidance
 * rather than silently failing or hanging on a request that can never
 * succeed. A link that only carries a place *name* (no coordinates in the
 * URL at all) comes back as `needs-geocode`, for the caller to resolve via
 * `geocodePlaceName`.
 */
export function parseGoogleMapsLink(raw: string): GoogleMapsLinkParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { status: "unresolvable", reason: "Paste a Google Maps link to continue." };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { status: "unresolvable", reason: "That doesn't look like a valid link." };
  }

  if (!isGoogleMapsHost(url.hostname)) {
    return { status: "unresolvable", reason: "That doesn't look like a Google Maps link." };
  }

  let decodedHref: string;
  try {
    decodedHref = decodeURIComponent(url.href);
  } catch {
    decodedHref = url.href;
  }

  for (const pattern of COORD_PATTERNS) {
    const match = decodedHref.match(pattern);
    if (!match) continue;
    const latitude = Number.parseFloat(match[1]);
    const longitude = Number.parseFloat(match[2]);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { status: "coordinates", coordinates: { latitude, longitude } };
    }
  }

  const placeNameHint = extractPlaceNameHint(url);
  if (placeNameHint) {
    return { status: "needs-geocode", placeNameHint };
  }

  const host = url.hostname.replace(/^www\./, "");
  if (SHORT_LINK_HOSTS.has(host)) {
    return {
      status: "unresolvable",
      reason: "Shortened links can't be read directly — open it in Maps, tap Share, then copy the full link instead.",
    };
  }

  return {
    status: "unresolvable",
    reason: "Couldn't find a location in that link — try the full address link from Maps.",
  };
}
