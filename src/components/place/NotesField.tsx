import type { ReactNode } from "react";
import { getCategoryConfig } from "@/config/categories";
import { bestTimeOptions } from "@/config/categories";
import type { Location } from "@/types/location";

interface NotesFieldProps {
  location: Location;
}

const timeIcons: Record<string, string> = {
  sunrise: "🌅",
  sunset: "🌇",
  midday: "☀️",
  night: "🌙",
  any: "✨",
};

/** Renders the notes section with the label/format that the location's
 * top-level category calls for — driven entirely by `categoryConfig`, so
 * a new category (and its own notes shape) needs no changes here. */
export function NotesField({ location }: NotesFieldProps) {
  const config = getCategoryConfig(location.topLevelCategory);
  const { notes } = location;

  if (notes.kind === "to-eat") {
    if (!notes.youJustGotta) return null;
    // The signature recommendation for a place gets its own slightly
    // larger, more generously spaced treatment rather than the compact
    // metadata-row styling every other notes section uses — editorial
    // rather than compressed, without ballooning past the rest of the
    // page's hierarchy.
    return (
      <div className="flex flex-col gap-3 px-5 py-1">
        <p className="font-display text-sm text-text">{config.notesField.label}</p>
        <p className="font-script text-lg leading-relaxed text-eat">{notes.youJustGotta}</p>
      </div>
    );
  }

  if (notes.kind === "to-see") {
    return (
      <Section label={config.notesField.label}>
        <div className="flex flex-wrap gap-2">
          {bestTimeOptions.map((option) => {
            const active = option.value === notes.bestTime;
            return (
              <span
                key={option.value}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-accent text-xs transition-colors ${
                  active
                    ? "border-see bg-see/15 font-medium text-see"
                    : "border-line text-text-faint opacity-60"
                }`}
              >
                <span aria-hidden>{timeIcons[option.value]}</span>
                {option.label}
              </span>
            );
          })}
        </div>
      </Section>
    );
  }

  if (notes.kind === "to-do") {
    if (!notes.whatIsIt) return null;
    return (
      <Section label={config.notesField.label}>
        <p className="font-body text-sm leading-relaxed text-text-soft">{notes.whatIsIt}</p>
      </Section>
    );
  }

  return null;
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 px-5">
      <p className="font-display text-xs text-text">{label}</p>
      {children}
    </div>
  );
}
