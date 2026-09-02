import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

/** Applies the current theme to the document root and keeps following the
 * system preference until the user explicitly picks one. Mount once, near
 * the app root. */
export function useSyncTheme() {
  const theme = useAppStore((s) => s.theme);
  const themeIsUserSet = useAppStore((s) => s.themeIsUserSet);
  const setTheme = useAppStore((s) => s.setTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (themeIsUserSet) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      useAppStore.setState({ theme: event.matches ? "dark" : "light" });
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [themeIsUserSet, setTheme]);
}
