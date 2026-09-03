import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { MeshDistortMaterial, OrbitControls, Sparkles, useGLTF } from "@react-three/drei";
import * as THREE from "three";
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

// Every scene — placeholder or a real loaded model — is framed for this
// same fixed camera/OrbitControls setup, rather than computing a bespoke
// camera per asset. A real model is auto-scaled to fit this size (see
// `useAutoFit` below), so one camera rig works for any object without
// per-location tuning.
const CAMERA_POSITION: [number, number, number] = [0, 0.4, 3.4];
const CAMERA_FOV = 42;
const ORBIT_MIN_DISTANCE = 2.2;
const ORBIT_MAX_DISTANCE = 5;
const TARGET_SIZE = 2.6;

/**
 * A single, reusable 3D surface for every location. Dispatches purely on
 * `asset.format`: "glb"/"gltf" load through `RealModel` below; anything
 * else (a format without a loader yet, or a format whose `source` is
 * still empty because nothing's been captured) falls back to the same
 * generative `PlaceholderScene` this always used. Adding a loader for a
 * new format later is a change to this file alone — nothing calling
 * `ThreeDViewer` needs to know the difference.
 */
export function ThreeDViewer({ asset, seed, className }: ThreeDViewerProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  // Whether the real-model load failed — declared up front (with every
  // other hook) rather than after the "no asset" early return below, since
  // conditionally skipping a hook call breaks React's hook-order
  // invariant. Only ever set/read on the branch that actually tries to
  // load something real.
  const [loadFailed, setLoadFailed] = useState(false);

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

  const hasRealSource = asset.source.length > 0;
  const canLoadReal = hasRealSource && (asset.format === "glb" || asset.format === "gltf");

  return (
    <div className={`relative touch-none overflow-hidden bg-surface-row ${className ?? ""}`}>
      <ModelErrorBoundary fallback={<ErrorState />} onError={() => setLoadFailed(true)}>
        <Suspense fallback={<CanvasFallback />}>
          <Canvas camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }} dpr={[1, 1.75]}>
            {canLoadReal ? (
              <RealModel source={asset.source} />
            ) : (
              <PlaceholderScene seed={seed} isSplat={asset.format === "splat"} />
            )}
            <OrbitControls
              enablePan={false}
              enableZoom
              minDistance={ORBIT_MIN_DISTANCE}
              maxDistance={ORBIT_MAX_DISTANCE}
              autoRotate={!reducedMotion}
              autoRotateSpeed={1.1}
            />
          </Canvas>
        </Suspense>
      </ModelErrorBoundary>
      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-scrim px-2.5 py-1 font-accent text-[10px] font-medium text-text backdrop-blur-sm">
        3D Preview
      </div>
      {!loadFailed && (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-scrim px-2.5 py-1 font-body text-[10px] text-text-faint backdrop-blur-sm">
          Drag to explore
        </div>
      )}
    </div>
  );
}

/** Loads a real glTF/GLB (via drei's `useGLTF`, which already registers
 * both the Draco and Meshopt decoders — this asset ships Meshopt-
 * compressed geometry and a WebP texture, both handled automatically).
 * Suspends while loading (caught by the `Suspense` above) and throws on
 * a genuine failure — bad URL, network error, malformed file — which
 * `ModelErrorBoundary` catches instead of taking down the whole page.
 *
 * Scenes come in at whatever scale and origin their source software used
 * (this one is ~29 units wide, sitting on the ground at y=0 rather than
 * centered) — `useAutoFit` measures the loaded scene's actual bounding
 * box and computes an offset/scale that recenters it at the origin and
 * fits it to `TARGET_SIZE`, so the same fixed camera/OrbitControls range
 * above frames it well without knowing anything about this specific
 * asset. Any future glTF dropped in here gets the same treatment. */
function RealModel({ source }: { source: string }) {
  const { scene } = useGLTF(source);
  const { position, scale } = useAutoFit(scene, TARGET_SIZE);

  return (
    <group position={position} scale={scale}>
      <ambientLight intensity={0.95} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#7367fe" />
      <primitive object={scene} />
    </group>
  );
}

function useAutoFit(object: THREE.Object3D, targetSize: number) {
  return useMemo(() => {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDimension;
    return {
      position: [-center.x * scale, -center.y * scale, -center.z * scale] as [number, number, number],
      scale,
    };
  }, [object, targetSize]);
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

/** A class component because React error boundaries can only be class
 * components — this is the one place in the app that needs to be. Catches
 * a real load failure (bad URL, network error, malformed asset) from
 * `RealModel`/`useGLTF`, which throws rather than suspending once the
 * loader's promise actually rejects. */
interface ModelErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: () => void;
}

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("3D model failed to load:", error);
    this.props.onError?.();
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function ErrorState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <EmptyState
        icon={<CubeIcon />}
        title="Couldn't load the 3D preview"
        description="The model didn't load — check your connection and try again."
      />
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
