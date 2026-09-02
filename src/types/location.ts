/**
 * Core domain types for Sojourn.
 *
 * These are deliberately backend-agnostic: nothing here assumes mock data
 * vs. a real database. `src/data/repository.ts` is the seam where that
 * decision lives, so swapping mock JSON for a real API/DB later only
 * touches that one file.
 */

export type TopLevelCategory = "to-see" | "to-eat" | "to-do";

/** Second-level categories, grouped by their parent. Extend freely — the
 * UI derives its filter lists and colors from `categoryConfig`, not from
 * hardcoded switch statements. */
export type ToEatCategory =
  | "italian"
  | "chinese"
  | "far-east-asian"
  | "brewpubs"
  | "south-east-asian"
  | "diners"
  | "kebabs-biryani"
  | "dosa"
  | "cafes"
  | "dhabas"
  | "budget-bites"
  | "burgers"
  | "dessert";

export type ToSeeCategory = "lakes" | "art-museums" | "natural-wonders" | "architecture";

export type ToDoCategory = "physical" | "eh";

export type SecondLevelCategory = ToEatCategory | ToSeeCategory | ToDoCategory;

/** Discriminated notes payload — shape depends on the top-level category.
 * This is what lets the UI change label/format without string-sniffing. */
export type LocationNotes =
  | { kind: "to-eat"; youJustGotta: string }
  | { kind: "to-see"; bestTime: "sunrise" | "sunset" | "midday" | "night" | "any" }
  | { kind: "to-do"; whatIsIt: string };

export type ThreeDAsset =
  | { kind: "none" }
  | { kind: "splat"; url: string; posterUrl?: string }
  | { kind: "model"; url: string; posterUrl?: string };

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  id: string;
  name: string;
  coordinates: Coordinates;
  googleMapsUrl: string;
  topLevelCategory: TopLevelCategory;
  secondLevelCategory: SecondLevelCategory;
  image: string;
  threeDAsset: ThreeDAsset;
  /** Personal 5-star rating, in half-point increments. */
  adiScore: number;
  notes: LocationNotes;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/** What a not-yet-built Contribute form will submit. Kept close to
 * `Location` on purpose so the future form can build one of these and
 * hand it to the repository without new plumbing. */
export type LocationDraft = Omit<Location, "id" | "createdAt" | "updatedAt">;
