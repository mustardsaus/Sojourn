import clsx from "clsx";
import { MapView } from "@/components/map/MapView";
import type { MapMarkerSpec } from "@/hooks/useMapMarkers";
import type { Coordinates } from "@/types/location";

interface LocationPreviewMapProps {
  coordinates: Coordinates;
  className?: string;
}

/** A small, quiet confirmation that a pasted link actually resolved
 * somewhere real — reuses the same `MapView` (and the same "you"-style
 * glowing pin) the rest of the app already renders, just non-interactive
 * and boxed into a small card, rather than a bespoke static-map component
 * with its own tile math to maintain. */
export function LocationPreviewMap({ coordinates, className }: LocationPreviewMapProps) {
  const markers: MapMarkerSpec[] = [{ id: "__contribute_preview__", coordinates, kind: "you" }];

  return (
    <div className={clsx("relative overflow-hidden rounded-[10px]", className)}>
      <MapView center={coordinates} zoom={15} markers={markers} interactive={false} />
    </div>
  );
}
