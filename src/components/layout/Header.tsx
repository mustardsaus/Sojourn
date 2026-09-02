import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  titleBeforeAccent: string;
  className?: string;
}

/** Shared top bar for both the dashboard and the Place Page: the "Maps"
 * breadcrumb/menu, the big two-tone heading, and the day/night control. */
export function Header({ titleBeforeAccent, className }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className={className}>
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1 font-display text-sm text-text"
            aria-expanded={menuOpen}
          >
            Maps
            <motion.svg
              animate={{ rotate: menuOpen ? 180 : 0 }}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                className="absolute left-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl bg-surface p-1 shadow-card"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/");
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left font-body text-xs text-text hover:bg-pill"
                >
                  Dashboard
                </button>
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-lg px-3 py-2 text-left font-body text-xs text-text-faint"
                >
                  Itineraries · soon
                </button>
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-lg px-3 py-2 text-left font-body text-xs text-text-faint"
                >
                  Contribute · soon
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <ThemeToggle />
      </div>
      <h1 className="mt-6 font-display text-[36px] leading-[40px] text-text">
        <span className="text-text-soft">{titleBeforeAccent}</span> <span className="text-accent">Sojourn</span>
      </h1>
    </header>
  );
}
