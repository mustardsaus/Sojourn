import { motion } from "framer-motion";
import clsx from "clsx";
import { topLevelCategories } from "@/config/categories";
import type { CategoryFilterValue } from "@/store/useAppStore";

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
  className?: string;
}

const options: { value: CategoryFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  ...topLevelCategories.map((c) => ({ value: c.value, label: c.label })),
];

export function CategoryFilter({ value, onChange, className }: CategoryFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter by category"
      className={clsx("no-scrollbar flex items-center gap-2 overflow-x-auto", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              // `isolate` gives this button its own stacking context so the
              // active fill's negative z-index stays contained here (behind
              // the label text) instead of escaping to the page's own
              // stacking context, where it silently painted behind
              // everything — invisible white-on-white text on a light page.
              "relative isolate shrink-0 rounded-[10px] border px-4 py-[7px] font-display text-xs leading-5 transition-colors duration-200",
              active
                ? "border-accent-soft text-white"
                : "border-pill-border bg-pill text-text hover:border-text-faint",
            )}
          >
            {active && (
              <motion.span
                layoutId="category-filter-active"
                className="absolute inset-0 -z-10 rounded-[10px] bg-accent"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
