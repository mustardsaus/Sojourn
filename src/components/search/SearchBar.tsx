import { useRef, useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFocusChange?: (focused: boolean) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, onFocusChange, placeholder, className }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  return (
    <div className={className}>
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-center gap-2">
          <SearchIcon className="text-text-faint" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setFocused(true);
              onFocusChange?.(true);
            }}
            onBlur={() => {
              setFocused(false);
              onFocusChange?.(false);
            }}
            placeholder={placeholder ?? "Search by name, category etc"}
            aria-label="Search places"
            className="w-full bg-transparent font-display text-xs text-text placeholder:text-text-faint focus:outline-none"
          />
          {value && (
            <button
              aria-label="Clear search"
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              className="text-text-faint transition-opacity hover:opacity-70"
            >
              <CloseIcon />
            </button>
          )}
        </div>
        <div
          className="h-px w-full transition-colors duration-200"
          style={{ background: focused ? "var(--color-accent)" : "var(--color-line)" }}
        />
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
