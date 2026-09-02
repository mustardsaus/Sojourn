export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? "size-5 text-accent"}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MapLoadingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner className="size-7 text-accent" />
        <p className="font-display text-xs text-text-faint">Finding your Sojourn…</p>
      </div>
    </div>
  );
}
