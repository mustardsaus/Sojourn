import { useEffect } from "react";
import { Marker, Polyline, useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import { MapView } from "@/components/map/MapView";
import { getCategoryPinIcon, getCurrentLocationIcon } from "@/lib/mapIcons";
import { ACCENT_HEX } from "@/config/map";
import type { Coordinates, Location } from "@/types/location";
import type { RouteOrigin } from "@/hooks/useRoute";

interface RouteMapProps {
  origin: RouteOrigin;
  originCoordinates: Coordinates;
  destination: Location;
  className?: string;
}

function FitToRoute({ a, b }: { a: Coordinates; b: Coordinates }) {
  const map = useMap();
  useEffect(() => {
    const bounds = latLngBounds([
      [a.latitude, a.longitude],
      [b.latitude, b.longitude],
    ]);
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 });
  }, [a.latitude, a.longitude, b.latitude, b.longitude, map]);
  return null;
}

export function RouteMap({ origin, originCoordinates, destination, className }: RouteMapProps) {
  const path: [number, number][] = [
    [originCoordinates.latitude, originCoordinates.longitude],
    [destination.coordinates.latitude, destination.coordinates.longitude],
  ];
  const originIcon = origin.type === "current" ? getCurrentLocationIcon() : getCategoryPinIcon(origin.location.topLevelCategory);

  return (
    <MapView center={destination.coordinates} zoom={13} className={className}>
      <FitToRoute a={originCoordinates} b={destination.coordinates} />
      {/* Soft glow beneath the animated line for a more premium route look. */}
      <Polyline positions={path} pathOptions={{ color: ACCENT_HEX, weight: 9, opacity: 0.16, lineCap: "round" }} />
      <Polyline
        positions={path}
        pathOptions={{ color: ACCENT_HEX, weight: 3.5, opacity: 0.9, lineCap: "round", className: "route-path" }}
      />
      <Marker position={[originCoordinates.latitude, originCoordinates.longitude]} icon={originIcon} interactive={false} />
      <Marker
        position={[destination.coordinates.latitude, destination.coordinates.longitude]}
        icon={getCategoryPinIcon(destination.topLevelCategory)}
        interactive={false}
      />
    </MapView>
  );
}
