import { useRef } from "react";
import { Marker } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import type { Location, Coordinates } from "@/types/location";
import { getCategoryPinIcon, getCurrentLocationIcon, setMarkerActive } from "@/lib/mapIcons";

interface LocationMarkersProps {
  locations: Location[];
  selectedId?: string | null;
  onSelect: (location: Location) => void;
  currentLocation?: Coordinates;
}

export function LocationMarkers({ locations, selectedId, onSelect, currentLocation }: LocationMarkersProps) {
  return (
    <>
      {currentLocation && (
        <Marker
          position={[currentLocation.latitude, currentLocation.longitude]}
          icon={getCurrentLocationIcon()}
          interactive={false}
          keyboard={false}
          zIndexOffset={-100}
        />
      )}
      {locations.map((location) => (
        <LocationMarker
          key={location.id}
          location={location}
          isActive={location.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function LocationMarker({
  location,
  isActive,
  onSelect,
}: {
  location: Location;
  isActive: boolean;
  onSelect: (location: Location) => void;
}) {
  const ref = useRef<LeafletMarker | null>(null);

  return (
    <Marker
      ref={(marker) => {
        ref.current = marker;
        if (marker) setMarkerActive(marker, isActive);
      }}
      position={[location.coordinates.latitude, location.coordinates.longitude]}
      icon={getCategoryPinIcon(location.topLevelCategory)}
      zIndexOffset={isActive ? 1000 : 0}
      eventHandlers={{
        click: () => onSelect(location),
      }}
      alt={location.name}
    />
  );
}
