/** Deterministic pseudo-randomness keyed by a string seed (e.g. a location
 * id), so the same location always renders the same placeholder look. */
export function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}
