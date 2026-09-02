# Sojourn

A personal, map-first collection of places worth going — built with React, TypeScript, Vite, Tailwind CSS, and Leaflet.

## Running it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`). On your phone, use the "Network" URL Vite prints instead, as long as your phone is on the same Wi‑Fi as your computer.

## What's here

- **Map dashboard** (`/`) — full interactive map with custom pins, category filters (All / To See / To Eat / To Do), search, and a viewport-synced list of places currently on screen.
- **Place Page** (`/place/:id`) — route preview with live travel time and a Google Maps hand-off, the expanded place card (notes, rating, itineraries), and an interactive 3D viewer.
- **Contribute** (`/contribute`) — placeholder for the future "add a place" flow.

## Architecture notes for future you

- `src/types/` — the `Location` / `Itinerary` domain types.
- `src/config/categories.ts` — the single source of truth for top-level/second-level categories and how each category's notes field is labeled and rendered. Add a category here and the UI (filters, colors, notes display) picks it up automatically.
- `src/data/repository.ts` — the seam between UI and data. Everything talks to `locationRepository` / `itineraryRepository`, which today are backed by the mock data in `src/data/mockLocations.ts` and `mockItineraries.ts`. Swapping in a real database later (see below) means rewriting the *inside* of this file only.
- `src/components/three/ThreeDViewer.tsx` — reusable 3D viewer. Renders a generative placeholder today; the comment at the top of the file marks where to plug in a real Gaussian splat or glTF loader once you have captured assets.

## When you're ready for a real database

Mock data is genuinely fine for a personal, read-mostly app — there's no reason to stand up a database just to look at pins on a map. The moment that changes is when the **Contribute** module needs to *persist* new places you add from your phone, since a deployed Vercel app can't write to a JSON file that ships with the build.

At that point:
1. Pick a Postgres provider that plugs straight into Vercel — [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Supabase](https://supabase.com/) (Supabase also gives you file storage for photos, which you'll want).
2. Add a couple of API routes (or Supabase's client SDK) that do what `MockLocationRepository` does today: get all, get by id, search, create.
3. Swap the `new MockLocationRepository()` line in `src/data/repository.ts` for the real implementation. Nothing in `src/pages` or `src/components` needs to change, because they only ever call `locationRepository.*`.

## Deploying

This is a static Vite build — see the deployment notes shared alongside this project for the GitHub → Vercel steps.
