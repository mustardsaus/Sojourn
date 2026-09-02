import type { Itinerary, ItineraryLocation } from "@/types/itinerary";

const now = "2026-06-01T00:00:00.000Z";

/** The Itineraries module itself isn't built yet — this is just enough
 * relational data for Place Pages to render their "included in" section
 * against something real instead of a hardcoded placeholder count. */
export const mockItineraries: Itinerary[] = [
  { id: "pub-hopping", title: "Pub Hopping", durationLabel: "4 Hours", createdAt: now, updatedAt: now },
  { id: "sunsets-coffee", title: "Sunsets & Coffee", durationLabel: "8 Hours", createdAt: now, updatedAt: now },
  { id: "old-bangalore-food-crawl", title: "Old Bangalore Food Crawl", durationLabel: "6 Hours", createdAt: now, updatedAt: now },
  { id: "hill-day", title: "Hill Day", durationLabel: "12 Hours", createdAt: now, updatedAt: now },
];

export const mockItineraryLocations: ItineraryLocation[] = [
  { itineraryId: "pub-hopping", locationId: "basaveshwara-khanavali", position: 1 },
  { itineraryId: "sunsets-coffee", locationId: "basaveshwara-khanavali", position: 2 },
  { itineraryId: "old-bangalore-food-crawl", locationId: "basaveshwara-khanavali", position: 1 },
  { itineraryId: "old-bangalore-food-crawl", locationId: "vidyarthi-bhavan", position: 2 },
  { itineraryId: "hill-day", locationId: "nandi-hills", position: 1 },
  { itineraryId: "hill-day", locationId: "nandi-hills-trek", position: 2 },
];
