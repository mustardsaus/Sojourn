import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Location } from "@/types/location";
import type { RouteOrigin } from "@/hooks/useRoute";

interface RouteControlsProps {
  origin: RouteOrigin;
  onOriginChange: (origin: RouteOrigin) => void;
  destination: Location;
  savedLocations: Location[];
}

export function RouteControls({ origin, onOriginChange, destination, savedLocations }: RouteControlsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const originLabel = origin.type === "current" ? "Your Current Location" : origin.location.name;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <button onClick={() => setPickerOpen((v) => !v)} className="flex w-full flex-col gap-1 text-left">
          <span className="font-body text-[8px] text-text-faint">From</span>
          <span className="flex items-center justify-between font-display text-xs text-text">
            <span className="truncate">{originLabel}</span>
            <ChevronIcon open={pickerOpen} />
          </span>
        </button>
        <div className="mt-[7px] h-px w-full bg-line" />

        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="no-scrollbar absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-xl bg-surface p-1 shadow-card"
            >
              <button
                onClick={() => {
                  onOriginChange({ type: "current" });
                  setPickerOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left font-body text-xs text-text hover:bg-pill"
              >
                Your Current Location
              </button>
              {savedLocations
                .filter((l) => l.id !== destination.id)
                .map((location) => (
                  <button
                    key={location.id}
                    onClick={() => {
                      onOriginChange({ type: "location", location });
                      setPickerOpen(false);
                    }}
                    className="w-full truncate rounded-lg px-3 py-2 text-left font-body text-xs text-text hover:bg-pill"
                  >
                    {location.name}
                  </button>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-body text-[8px] text-text-faint">To</span>
        <span className="truncate font-display text-xs text-text">{destination.name}</span>
        <div className="mt-[7px] h-px w-full bg-line" />
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <motion.svg animate={{ rotate: open ? 180 : 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}
