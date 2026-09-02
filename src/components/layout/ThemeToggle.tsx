import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
      aria-pressed={isDark}
      className={`relative flex h-7 w-[50px] items-center rounded-full border border-pill-border bg-pill px-1 transition-colors ${className ?? ""}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="flex size-5 items-center justify-center rounded-full bg-accent text-white shadow-sm"
        style={{ marginLeft: isDark ? "auto" : 0 }}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </motion.span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.2a7 7 0 0 0 11 11.3z" />
    </svg>
  );
}
