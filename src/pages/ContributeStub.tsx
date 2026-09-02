import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/common/EmptyState";

/**
 * Placeholder screen for the future Contribute module. The data model
 * (`LocationDraft`, `categoryConfig`'s per-category notes field) is
 * already shaped for the real form — this route just doesn't build the
 * form itself yet.
 */
export function ContributeStub() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 bg-bg px-6 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <Header titleBeforeAccent="Add to your" />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-[14px] bg-bg-elevated py-10">
        <EmptyState
          icon={<PlusPinIcon />}
          title="Contribute is coming soon"
          description="Soon you'll drop in a Google Maps link, pick a category, and add your notes right from here."
        />
        <button
          onClick={() => navigate("/")}
          className="rounded-[10px] border border-accent-soft bg-accent px-5 py-2.5 font-display text-xs text-white"
        >
          Back to the map
        </button>
      </div>
    </div>
  );
}

function PlusPinIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22s7.5-7.24 7.5-13.1C19.5 4.55 16.14 1 12 1S4.5 4.55 4.5 8.9C4.5 14.76 12 22 12 22z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M12 6v6M9 9h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
