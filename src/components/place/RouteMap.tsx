import { useMemo } from "react";
import { MapView } from "@/components/map/MapView";
import type { MapMarkerSpec } from "@/hooks/useMapMarkers";
import type { Coordinates, Location } from "@/types/location";
import type { RouteOrigin } from "@/hooks/useRoute";

interface RouteMapProps {
  origin: RouteOrigin;
  originCoordinates: Coordinates;
  destination: Location;
  /** Actual road-network geometry ([lng, lat] pairs) once resolved. */
  route: [number, number][] | null;
  className?: string;
}

export function RouteMap({ origin, originCoordinates, destination, route, className }: RouteMapProps) {
  const markers: MapMarkerSpec[] = [
    origin.type === "current"
      ? { id: "route-origin", coordinates: originCoordinates, kind: "you" }
      : {
          id: "route-origin",
          coordinates: originCoordinates,
          kind: "category",
          category: origin.location.topLevelCategory,
        },
    {
      id: "route-destination",
      coordinates: destination.coordinates,
      kind: "category",
      category: destination.topLevelCategory,
    },
  ];

  // Fit to the whole route curve once it's ready (roads bow away from the
  // straight line between the two points), falling back to just the
  // endpoints while it's still loading.
  const fitBoundsTo = useMemo<Coordinates[]>(() => {
    if (route && route.length > 0) {
      return route.map(([longitude, latitude]) => ({ latitude, longitude }));
    }
    return [originCoordinates, destination.coordinates];
  }, [route, originCoordinates, destination.coordinates]);

  return (
    <MapView
      center={destination.coordinates}
      zoom={13}
      className={className}
      markers={markers}
      route={route}
      fitBoundsTo={fitBoundsTo}
    />
  );
}
