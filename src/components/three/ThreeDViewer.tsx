import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { MeshDistortMaterial, OrbitControls, Sparkles } from "@react-three/drei";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { hashSeed } from "@/lib/seededRandom";
import type { ThreeDAsset } from "@/types/location";

interface ThreeDViewerProps {
  asset: ThreeDAsset;
  /** Usually the location id — keeps the placeholder look stable per place. */
  seed: string;
  className?: string;
}

/**
 * A single, reusable 3D surface for every location. Today it renders a
 * generative placeholder scene (since no captured assets exist yet), but
 * the seam for a real asset is already here: once `asset.url` points at
 * an actual Gaussian splat (.ply/.splat) or glTF model, swap the body of
 * `PlaceholderScene` for a loader (e.g. drei's `useGLTF`, or a splat
 * renderer) keyed off `asset.kind` — nothing outside this file needs to
 * change.
 */
export function ThreeDViewer({ asset, seed, className }: ThreeDViewerProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const handler = () => setReducedMotion(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  if (asset.kind === "none") {
    return (
      <div className={`flex items-center justify-center bg-surface-row ${className ?? ""}`}>
        <EmptyState
          icon={<CubeIcon />}
          title="No 3D preview yet"
          description="A scan or splat for this place hasn't been captured yet."
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-surface-row ${className ?? ""}`}>
      <Suspense fallback={<CanvasFallback />}>
        <Canvas camera={{ position: [0, 0.4, 3.4], fov: 42 }} dpr={[1, 1.75]}>
          <PlaceholderScene seed={seed} isSplat={asset.kind === "splat"} />
          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={2.2}
            maxDistance={5}
            autoRotate={!reducedMotion}
            autoRotateSpeed={1.1}
          />
        </Canvas>
      </Suspense>
      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-scrim px-2.5 py-1 font-accent text-[10px] font-medium text-text backdrop-blur-sm">
        3D Preview
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-scrim px-2.5 py-1 font-body text-[10px] text-text-faint backdrop-blur-sm">
        Drag to explore
      </div>
    </div>
  );
}

function PlaceholderScene({ seed, isSplat }: { seed: string; isSplat: boolean }) {
  const hash = hashSeed(seed);
  const { color, distort, speed, detail } = useMemo(() => {
    const hue = hash % 360;
    return {
      color: `hsl(${hue}, 46%, 58%)`,
      distort: 0.22 + (hash % 25) / 100,
      speed: 1 + (hash % 8) / 10,
      detail: isSplat ? 3 : 1,
    };
  }, [hash, isSplat]);

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 4, 2]} intensity={1.15} />
      <directionalLight position={[-3, -2, -2]} intensity={0.35} color="#7367fe" />
      <mesh rotation={[0.45, 0.6, 0]}>
        <icosahedronGeometry args={[1.25, detail]} />
        <MeshDistortMaterial color={color} distort={distort} speed={speed} roughness={0.3} metalness={0.4} />
      </mesh>
      {isSplat && <Sparkles count={70} scale={3.4} size={1.8} speed={0.25} color={color} />}
    </>
  );
}

function CanvasFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <LoadingSpinner className="size-6 text-accent" />
    </div>
  );
}

function CubeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M4 6.5L12 11l8-4.5M12 11v11" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
