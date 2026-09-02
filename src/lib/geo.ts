import type { Coordinates, Location } from "@/types/location";

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function isWithinBounds(coordinates: Coordinates, bounds: MapBounds): boolean {
  const { latitude, longitude } = coordinates;
  const withinLat = latitude <= bounds.north && latitude >= bounds.south;
  // Longitude can wrap around the antimeridian; handle the simple case first.
  const withinLng =
    bounds.west <= bounds.east
      ? longitude >= bounds.west && longitude <= bounds.east
      : longitude >= bounds.west || longitude <= bounds.east;
  return withinLat && withinLng;
}

export function filterByBounds(locations: Location[], bounds: MapBounds | null): Location[] {
  if (!bounds) return locations;
  return locations.filter((location) => isWithinBounds(location.coordinates, bounds));
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(h));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Rough, dependency-free travel time estimate for the route preview.
 * Good enough for a UI affordance — the real trip still opens in Google
 * Maps for turn-by-turn accuracy. */
export function estimateTravelMinutes(km: number): number {
  const averageSpeedKmh = km > 15 ? 42 : 22;
  return Math.max(2, Math.round((km / averageSpeedKmh) * 60));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function googleMapsDirectionsUrl(origin: Coordinates | string, destination: Coordinates): string {
  const originParam = typeof origin === "string" ? origin : `${origin.latitude},${origin.longitude}`;
  const destParam = `${destination.latitude},${destination.longitude}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originParam)}&destination=${encodeURIComponent(destParam)}&travelmode=driving`;
}
