import { getCategoryColor } from "@/config/categories";
import type { TopLevelCategory } from "@/types/location";

function pinSvg(color: string) {
  return `
    <div class="map-pin__inner">
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 43C17 43 30.5 27.66 30.5 16.9C30.5 9.23 24.3 3 17 3C9.7 3 3.5 9.23 3.5 16.9C3.5 27.66 17 43 17 43Z"
          fill="${color}" stroke="rgba(0,0,0,0.35)" stroke-width="1.2"/>
        <circle cx="17" cy="16.5" r="7" fill="white" fill-opacity="0.92"/>
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
  el.style.width = "34px";
  el.style.height = "44px";
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
