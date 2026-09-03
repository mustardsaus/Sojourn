import { getCategoryColor } from "@/config/categories";
import type { TopLevelCategory } from "@/types/location";

// A small point of energy rather than a pin: a soft glowing dot with a
// faint pulsing halo and a short angled tick for a touch of "location
// marker" character, no filled teardrop shape, no bold outline. Each
// instance gets its own randomized pulse delay (see createCategoryPinElement)
// so the whole map doesn't breathe in unison.
function glowMarkerHtml(color: string) {
  return `
    <div class="map-glow" style="--marker-color:${color}">
      <span class="map-glow__ring"></span>
      <span class="map-glow__tick"></span>
      <span class="map-glow__dot"></span>
    </div>`;
}

function resolveColor(cssVar: string): string {
  if (typeof window === "undefined") return "#008d2a";
  if (!cssVar.startsWith("var(")) return cssVar;
  const name = cssVar.slice(4, -1).trim();
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || "#008d2a";
}

/** Builds a fresh marker DOM element for a category location — a glowing
 * dot, not a pin. A new element is created per marker instance (MapLibre's
 * Marker owns its element), and each gets a randomized negative animation
 * delay so the ambient pulse across the map reads as many independent
 * points of energy rather than one synchronized blink. */
export function createCategoryPinElement(category: TopLevelCategory): HTMLDivElement {
  const color = resolveColor(getCategoryColor(category));
  const el = document.createElement("div");
  el.className = "map-glow-wrap";
  el.innerHTML = glowMarkerHtml(color);
  el.style.width = "18px";
  el.style.height = "18px";
  el.style.cursor = "pointer";
  // A negative delay starts the animation partway through its cycle
  // immediately, rather than every marker beginning in lockstep at 0.
  const ring = el.querySelector<HTMLElement>(".map-glow__ring");
  if (ring) {
    const duration = 3.2 + Math.random() * 1.6;
    ring.style.animationDuration = `${duration}s`;
    ring.style.animationDelay = `-${(Math.random() * duration).toFixed(2)}s`;
  }
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
  el.classList.toggle("map-glow-wrap--active", active);
  el.style.zIndex = active ? "1000" : "";
}
