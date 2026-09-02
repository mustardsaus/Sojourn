import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TopLevelCategory } from "@/types/location";

export type CategoryFilterValue = "all" | TopLevelCategory;
export type Theme = "light" | "dark";

interface AppState {
  theme: Theme;
  themeIsUserSet: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  activeFilter: CategoryFilterValue;
  setActiveFilter: (filter: CategoryFilterValue) => void;
}

function prefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: prefersDark() ? "dark" : "light",
      themeIsUserSet: false,
      setTheme: (theme) => set({ theme, themeIsUserSet: true }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark", themeIsUserSet: true }),

      activeFilter: "all",
      setActiveFilter: (filter) => set({ activeFilter: filter }),
    }),
    {
      name: "sojourn-preferences",
      partialize: (state) => ({ theme: state.theme, themeIsUserSet: state.themeIsUserSet }),
    },
  ),
);
