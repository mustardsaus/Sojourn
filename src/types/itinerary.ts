/**
 * Itinerary types — the module is not built yet, but Place Pages need a
 * shape to query against for their "included in N itineraries" section.
 * A join table (`ItineraryLocation`) keeps the many-to-many relationship
 * clean instead of nesting arrays of full locations inside itineraries.
 */

export interface Itinerary {
  id: string;
  title: string;
  description?: string;
  durationLabel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryLocation {
  itineraryId: string;
  locationId: string;
  /** Order of this stop within the itinerary. */
  position: number;
}
