import { useItinerariesForLocation } from "@/hooks/useItinerariesForLocation";
import { EmptyState } from "@/components/common/EmptyState";

interface ItinerariesSectionProps {
  locationId: string;
}

/** Reserved slot for the not-yet-built Itineraries module. The data
 * relationship (which itineraries include this location) is real; only
 * the itinerary builder itself is still to come — clicking "View" here
 * is wired up to nothing yet on purpose. */
export function ItinerariesSection({ locationId }: ItinerariesSectionProps) {
  const itineraries = useItinerariesForLocation(locationId);

  return (
    <div className="flex flex-col gap-2.5 px-5">
      <p className="font-display text-xs text-text">
        {itineraries && itineraries.length > 0
          ? `Included in ${itineraries.length} ${itineraries.length === 1 ? "itinerary" : "itineraries"}`
          : "Itineraries"}
      </p>

      {itineraries === null && <div className="h-10 animate-pulse rounded-lg bg-pill" />}

      {itineraries !== null && itineraries.length === 0 && (
        <EmptyState
          align="start"
          className="px-0 py-2"
          title="Not part of any itineraries yet"
          description="Once the Itineraries module ships, trips built from your saved places will show up here."
        />
      )}

      {itineraries?.map((itinerary) => (
        <div key={itinerary.id} className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between font-body text-xs text-text">
            <span className="font-display">{itinerary.title}</span>
            <button className="text-text opacity-80 transition-opacity hover:opacity-100">View</button>
          </div>
          <div className="h-px w-full bg-line" />
        </div>
      ))}
    </div>
  );
}
