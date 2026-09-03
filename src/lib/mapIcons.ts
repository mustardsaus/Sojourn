import { getCategoryColor } from "@/config/categories";
import type { TopLevelCategory } from "@/types/location";

// A thin outline pin — stroke only, no fill anywhere (not even the center
// ring) — so it reads as a quiet location marker rather than a bold,
// filled map pin competing with the route glow and the map itself for
// attention.
function pinSvg(color: string) {
  return `
    <div class="map-pin__inner">
      <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 32.5C13 32.5 22.5 20.77 22.5 12.8C22.5 6.83 18.35 2 13 2C7.65 2 3.5 6.83 3.5 12.8C3.5 20.77 13 32.5 13 32.5Z"
          stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/>
        <circle cx="13" cy="12.6" r="3.1" stroke="${color}" stroke-width="1.6"/>
      </svg>
    </div>`;
}

function resolveColor(cssVar: string): string {
  if (typeof window === "undefined") return "#008d2a";
  if (!cssVar.startsWith("var(")) return cssVar;
  const name = cssVar.slice(4, -1).trim();
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || "#008d2a";
}

/** Builds a fresh marker DOM element for a category pin. A new element is
 * created per marker instance (MapLibre's Marker owns its element), but
 * the SVG markup itself is identical for a given category. */
export function createCategoryPinElement(category: TopLevelCategory): HTMLDivElement {
  const color = resolveColor(getCategoryColor(category));
  const el = document.createElement("div");
  el.className = "map-pin";
  el.innerHTML = pinSvg(color);
  el.style.width = "26px";
  el.style.height = "34px";
  el.style.cursor = "pointer";
  return el;
}

export function createCurrentLocationElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "map-pin map-pin--you";
  el.innerHTML = `
    <div class="map-pin__you-wrap">
      <span class="map-pin__pulse"></span>
      <span class="map-pin__you-dot"></span>
    </div>`;
  el.style.width = "22px";
  el.style.height = "22px";
  return el;
}

export function setMarkerElementActive(el: HTMLElement | null, active: boolean) {
  if (!el) return;
  el.classList.toggle("map-pin--active", active);
  el.style.zIndex = active ? "1000" : "";
}
