import type { Location, LocationDraft } from "@/types/location";
import type { Itinerary } from "@/types/itinerary";
import { mockLocations } from "./mockLocations";
import { mockItineraries, mockItineraryLocations } from "./mockItineraries";

/**
 * The seam between UI and data source. Every screen talks to
 * `locationRepository` / `itineraryRepository`, never to `mockLocations`
 * directly — so replacing this file's insides with real HTTP calls to a
 * database-backed API later requires no changes anywhere else.
 */
export interface LocationRepository {
  getAll(): Promise<Location[]>;
  getById(id: string): Promise<Location | undefined>;
  search(query: string): Promise<Location[]>;
  create(draft: LocationDraft): Promise<Location>;
}

export interface ItineraryRepository {
  getForLocation(locationId: string): Promise<Itinerary[]>;
}

/** Small artificial delay so loading states are real to build against,
 * not just theoretical. Set to 0 and nothing else needs to change. */
const LATENCY_MS = 220;
const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

let store = [...mockLocations];

class MockLocationRepository implements LocationRepository {
  async getAll() {
    return delay([...store]);
  }

  async getById(id: string) {
    return delay(store.find((location) => location.id === id));
  }

  async search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return delay([]);
    return delay(
      store.filter((location) => {
        return (
          location.name.toLowerCase().includes(q) ||
          location.secondLevelCategory.toLowerCase().includes(q) ||
          location.topLevelCategory.toLowerCase().includes(q)
        );
      }),
    );
  }

  async create(draft: LocationDraft) {
    const now = new Date().toISOString();
    const location: Location = {
      ...draft,
      id: `${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    store = [...store, location];
    return delay(location);
  }
}

class MockItineraryRepository implements ItineraryRepository {
  async getForLocation(locationId: string) {
    const ids = new Set(
      mockItineraryLocations.filter((link) => link.locationId === locationId).map((link) => link.itineraryId),
    );
    return delay(mockItineraries.filter((itinerary) => ids.has(itinerary.id)));
  }
}

export const locationRepository: LocationRepository = new MockLocationRepository();
export const itineraryRepository: ItineraryRepository = new MockItineraryRepository();
