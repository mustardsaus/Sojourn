import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { createCategoryPinElement, createCurrentLocationElement, setMarkerElementActive } from "@/lib/mapIcons";
import type { Coordinates, TopLevelCategory } from "@/types/location";

export interface MapMarkerSpec {
  id: string;
  coordinates: Coordinates;
  kind: "category" | "you";
  category?: TopLevelCategory;
  active?: boolean;
  onClick?: () => void;
}

interface Entry {
  marker: maplibregl.Marker;
  element: HTMLElement;
}

/** Imperatively keeps MapLibre `Marker` instances in sync with a
 * declarative list of specs — MapLibre isn't a React-children API the way
 * react-leaflet was, so markers are diffed by id here instead of being
 * expressed as JSX. */
export function useMapMarkers(map: maplibregl.Map | null, specs: MapMarkerSpec[]) {
  const entriesRef = useRef(new Map<string, Entry>());
  const onClickRef = useRef(new Map<string, (() => void) | undefined>());

  useEffect(() => {
    onClickRef.current = new Map(specs.map((s) => [s.id, s.onClick]));
  }, [specs]);

  useEffect(() => {
    if (!map) return;
    const entries = entriesRef.current;
    const seen = new Set<string>();

    for (const spec of specs) {
      seen.add(spec.id);
      let entry = entries.get(spec.id);

      if (!entry) {
        const element =
          spec.kind === "you" ? createCurrentLocationElement() : createCategoryPinElement(spec.category!);
        if (spec.kind === "category") {
          element.addEventListener("click", (event) => {
            event.stopPropagation();
            onClickRef.current.get(spec.id)?.();
          });
        }
        // Both marker kinds are small glowing dots centered exactly on
        // their coordinate now, not teardrops pointing down from a tip.
        const marker = new maplibregl.Marker({ element, anchor: "center" })
          .setLngLat([spec.coordinates.longitude, spec.coordinates.latitude])
          .addTo(map);
        entry = { marker, element };
        entries.set(spec.id, entry);
      } else {
        entry.marker.setLngLat([spec.coordinates.longitude, spec.coordinates.latitude]);
      }

      setMarkerElementActive(entry.element, Boolean(spec.active));
    }

    for (const [id, entry] of entries) {
      if (!seen.has(id)) {
        entry.marker.remove();
        entries.delete(id);
      }
    }
  }, [map, specs]);

  // Full teardown only when the map instance itself goes away.
  useEffect(() => {
    const entries = entriesRef.current;
    return () => {
      entries.forEach((entry) => entry.marker.remove());
      entries.clear();
    };
  }, [map]);
}
