import { useEffect, useState } from "react";
import type { Itinerary } from "@/types/itinerary";
import { itineraryRepository } from "@/data/repository";

export function useItinerariesForLocation(locationId: string) {
  const [itineraries, setItineraries] = useState<Itinerary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItineraries(null);
    itineraryRepository.getForLocation(locationId).then((result) => {
      if (!cancelled) setItineraries(result);
    });
    return () => {
      cancelled = true;
    };
  }, [locationId]);

  return itineraries;
}
