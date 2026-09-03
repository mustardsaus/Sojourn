import type {
  LocationNotes,
  SecondLevelCategory,
  ToDoCategory,
  ToEatCategory,
  ToSeeCategory,
  TopLevelCategory,
} from "@/types/location";

/** One field definition per top-level category. The UI (notes display,
 * and eventually the Contribute form) reads this instead of branching on
 * category strings — add a category here and both surfaces pick it up. */
export type NotesFieldConfig =
  | { type: "text"; label: string; placeholder: string }
  | { type: "select"; label: string; options: { value: string; label: string }[] };

export interface SecondLevelOption<T extends string = string> {
  value: T;
  label: string;
}

export interface TopLevelCategoryConfig<T extends string = string> {
  value: TopLevelCategory;
  label: string;
  shortLabel: string;
  /** Accent color for pins, tags, and highlights tied to this category. */
  color: string;
  secondLevelCategories: SecondLevelOption<T>[];
  notesField: NotesFieldConfig;
  emptyNotes: () => LocationNotes;
}

const toEatSecondLevel: SecondLevelOption<ToEatCategory>[] = [
  { value: "italian", label: "Italian" },
  { value: "chinese", label: "Chinese" },
  { value: "far-east-asian", label: "Far East Asian" },
  { value: "brewpubs", label: "Brewpubs" },
  { value: "south-east-asian", label: "South East Asian" },
  { value: "diners", label: "Diners" },
  { value: "kebabs-biryani", label: "Kebabs & Biryani" },
  { value: "dosa", label: "Dosaaa" },
  { value: "cafes", label: "Cafes" },
  { value: "dhabas", label: "Dhabas" },
  { value: "budget-bites", label: "Budget Bites" },
  { value: "burgers", label: "Burgers" },
  { value: "dessert", label: "Dessert" },
];

const toSeeSecondLevel: SecondLevelOption<ToSeeCategory>[] = [
  { value: "lakes", label: "Lakes" },
  { value: "art-museums", label: "Art & Museums" },
  { value: "natural-wonders", label: "Natural Wonders" },
  { value: "architecture", label: "Architecture" },
];

const toDoSecondLevel: SecondLevelOption<ToDoCategory>[] = [
  { value: "physical", label: "Physical" },
  { value: "eh", label: "Eh" },
];

export const bestTimeOptions = [
  { value: "sunrise", label: "Sunrise" },
  { value: "sunset", label: "Sunset" },
  { value: "midday", label: "Midday" },
  { value: "night", label: "Night" },
  { value: "any", label: "Any" },
] as const;

export const categoryConfig: Record<TopLevelCategory, TopLevelCategoryConfig> = {
  "to-see": {
    value: "to-see",
    label: "To See",
    shortLabel: "See",
    color: "var(--color-see)",
    secondLevelCategories: toSeeSecondLevel,
    notesField: {
      type: "select",
      label: "Best Time?",
      options: [...bestTimeOptions],
    },
    emptyNotes: () => ({ kind: "to-see", bestTime: "any" }),
  },
  "to-eat": {
    value: "to-eat",
    label: "To Eat",
    shortLabel: "Eat",
    color: "var(--color-eat)",
    secondLevelCategories: toEatSecondLevel,
    notesField: {
      type: "text",
      label: "You Just Gotta",
      placeholder: "Try the truffle pasta and tiramisu.",
    },
    emptyNotes: () => ({ kind: "to-eat", youJustGotta: "" }),
  },
  "to-do": {
    value: "to-do",
    label: "To Do",
    shortLabel: "Do",
    color: "var(--color-do)",
    secondLevelCategories: toDoSecondLevel,
    notesField: {
      type: "text",
      label: "What Is It?",
      placeholder: "Describe the activity.",
    },
    emptyNotes: () => ({ kind: "to-do", whatIsIt: "" }),
  },
};

export const topLevelCategories = Object.values(categoryConfig);

export function getCategoryConfig(topLevel: TopLevelCategory): TopLevelCategoryConfig {
  return categoryConfig[topLevel];
}

export function getSecondLevelLabel(
  topLevel: TopLevelCategory,
  secondLevel: SecondLevelCategory,
): string {
  const match = categoryConfig[topLevel].secondLevelCategories.find(
    (option) => option.value === secondLevel,
  );
  return match?.label ?? secondLevel;
}

export function getCategoryColor(topLevel: TopLevelCategory): string {
  return categoryConfig[topLevel].color;
}
