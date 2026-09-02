import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { useAppStore } from "@/store/useAppStore";
import { TILE_LAYERS, DEFAULT_ZOOM } from "@/config/map";
import type { Coordinates } from "@/types/location";
import type { MapBounds } from "@/lib/geo";

interface MapViewProps {
  center: Coordinates;
  zoom?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
  /** Bumping this value (alongside a new `flyTo` target) triggers a pan/zoom. */
  flyToToken?: number;
  flyTo?: Coordinates;
  flyToZoom?: number;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

function toBounds(map: LeafletMap): MapBounds {
  const b = map.getBounds();
  return { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() };
}

function BoundsWatcher({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange?.(toBounds(map)),
    zoomend: () => onBoundsChange?.(toBounds(map)),
  });

  useEffect(() => {
    onBoundsChange?.(toBounds(map));
    // Only on mount — subsequent updates come from the move/zoom handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function FlyToController({ target, zoom, token }: { target?: Coordinates; zoom?: number; token?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.latitude, target.longitude], zoom ?? map.getZoom(), {
      duration: 1.1,
      easeLinearity: 0.25,
    });
    // Re-run whenever the caller bumps the token, even for the same coordinates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  return null;
}

export function MapView({
  center,
  zoom = DEFAULT_ZOOM,
  onBoundsChange,
  flyToToken,
  flyTo,
  flyToZoom,
  children,
  className,
  interactive = true,
}: MapViewProps) {
  const theme = useAppStore((s) => s.theme);
  const tiles = theme === "dark" ? TILE_LAYERS.dark : TILE_LAYERS.light;
  const mapRef = useRef<LeafletMap | null>(null);

  return (
    <MapContainer
      ref={mapRef}
      center={[center.latitude, center.longitude]}
      zoom={zoom}
      zoomControl={false}
      attributionControl={interactive}
      dragging={interactive}
      scrollWheelZoom={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive}
      boxZoom={false}
      keyboard={interactive}
      className={className ?? "size-full"}
    >
      <TileLayer url={tiles.url} attribution={tiles.attribution} />
      <TileLayer url={tiles.labelsUrl} />
      <BoundsWatcher onBoundsChange={onBoundsChange} />
      <FlyToController target={flyTo} zoom={flyToZoom} token={flyToToken} />
      {children}
    </MapContainer>
  );
}
