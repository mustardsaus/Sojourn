/**
 * A module-level (not React state) flag for "has the cinematic first-load
 * sequence already played this session." Module scope is exactly what we
 * want here: it survives client-side route changes (Dashboard <-> Place
 * Page), which don't reload this module, so navigating between pages never
 * replays the reveal — but a genuine full page reload/fresh visit resets
 * it, which is the correct definition of "first load."
 *
 * Split deliberately into a pure read (`hasIntroPlayed`) and an idempotent
 * write (`markIntroPlayed`) rather than one "consume and return whether
 * this was the first call" function. React 18 StrictMode calls a
 * `useState(() => ...)` initializer twice in development specifically to
 * catch impure initializers — a single impure "claim the flag" function
 * used there gets called twice before React settles on either result,
 * which one it keeps between the two is not something to rely on, and
 * either way the flag itself ends up permanently flipped by the first of
 * the two calls regardless of which return value wins. Reading here is
 * pure (safe to call any number of times) and writing is idempotent (safe
 * to call more than once), so the intended pattern —
 * `useState(() => !hasIntroPlayed())` for the read, `markIntroPlayed()`
 * from a `useEffect` for the write — behaves correctly under that
 * double-invoke instead of silently losing the first load's reveal.
 */
let played = false;

export function hasIntroPlayed(): boolean {
  return played;
}

export function markIntroPlayed(): void {
  played = true;
}
