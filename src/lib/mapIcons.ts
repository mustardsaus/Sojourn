import L from "leaflet";
import { getCategoryColor } from "@/config/categories";
import type { TopLevelCategory } from "@/types/location";

const PIN_SIZE = 34;
const PIN_SIZE_ACTIVE = 44;

function pinSvg(color: string) {
  return `
    <svg width="100%" height="100%" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 43C17 43 30.5 27.66 30.5 16.9C30.5 9.23 24.3 3 17 3C9.7 3 3.5 9.23 3.5 16.9C3.5 27.66 17 43 17 43Z"
        fill="${color}" stroke="rgba(0,0,0,0.35)" stroke-width="1.2"/>
      <circle cx="17" cy="16.5" r="7" fill="white" fill-opacity="0.92"/>
    </svg>`;
}

const cache = new Map<string, L.DivIcon>();

/** One stable divIcon per category — selection state is applied afterwards
 * by toggling a CSS class on the marker's live DOM element (see
 * `setMarkerActive`), so Leaflet never has to tear down and recreate the
 * icon just to animate it. */
export function getCategoryPinIcon(category: TopLevelCategory): L.DivIcon {
  const cached = cache.get(category);
  if (cached) return cached;

  const color = resolveColor(getCategoryColor(category));
  const icon = L.divIcon({
    className: "map-pin",
    html: `<div class="map-pin__inner">${pinSvg(color)}</div>`,
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE],
    popupAnchor: [0, -PIN_SIZE],
  });
  cache.set(category, icon);
  return icon;
}

let youIcon: L.DivIcon | null = null;
export function getCurrentLocationIcon(): L.DivIcon {
  if (youIcon) return youIcon;
  youIcon = L.divIcon({
    className: "map-pin map-pin--you",
    html: `
      <div class="map-pin__you-wrap">
        <span class="map-pin__pulse"></span>
        <span class="map-pin__you-dot"></span>
      </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
  return youIcon;
}

export function setMarkerActive(marker: L.Marker | null, active: boolean) {
  const el = marker?.getElement();
  if (!el) return;
  el.classList.toggle("map-pin--active", active);
  el.style.zIndex = active ? "1000" : "";
}

function resolveColor(cssVar: string): string {
  if (typeof window === "undefined") return "#008d2a";
  if (!cssVar.startsWith("var(")) return cssVar;
  const name = cssVar.slice(4, -1).trim();
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || "#008d2a";
}

export const PIN_SIZES = { base: PIN_SIZE, active: PIN_SIZE_ACTIVE };
