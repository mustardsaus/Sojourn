import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Dashboard } from "@/pages/Dashboard";
import { useSyncTheme } from "@/hooks/useTheme";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

// Route-level code splitting: the map dashboard is the first thing every
// visit needs, so it's loaded eagerly. The Place Page pulls in the 3D
// viewer (three.js + drei), which is meaningfully heavy — no reason to
// ship it before someone actually opens a place.
const PlacePage = lazy(() => import("@/pages/PlacePage").then((m) => ({ default: m.PlacePage })));
const Contribute = lazy(() => import("@/pages/Contribute").then((m) => ({ default: m.Contribute })));

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <LoadingSpinner className="size-6 text-accent" />
    </div>
  );
}

export default function App() {
  useSyncTheme();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/place/:id" element={<PlacePage />} />
        <Route path="/contribute" element={<Contribute />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
