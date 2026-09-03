import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { ThreeDAsset, ThreeDAssetFormat } from "@/types/location";

interface ThreeDUploadFieldProps {
  asset: ThreeDAsset;
  onChange: (asset: ThreeDAsset) => void;
  /** Fires whenever a file is actively being read/validated. The 3D asset
   * is always optional, but a submit that fires *while* one is mid-upload
   * would otherwise silently save the location without it (the parent has
   * no other way to know an upload is still in flight) — the caller uses
   * this to hold the submit button until the upload settles one way or
   * the other. */
  onBusyChange?: (busy: boolean) => void;
  className?: string;
}

type Status = "idle" | "reading" | "validating" | "success" | "error";

function detectFormat(filename: string): ThreeDAssetFormat {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "glb") return "glb";
  if (ext === "gltf") return "gltf";
  if (ext === "ply") return "ply";
  if (ext === "splat" || ext === "spz" || ext === "ksplat") return "splat";
  return "other";
}

// Same default Draco decoder CDN drei's `useGLTF` (used by `ThreeDViewer`)
// falls back to — keeping this identical means a file that validates here
// is genuinely loadable by the real viewer, not just by a differently-
// configured parser.
const DRACO_DECODER_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.5/";

/** Actually attempts to parse the file through the same loaders/decoders
 * `ThreeDViewer` uses (Draco + Meshopt both registered, matching drei's
 * `useGLTF`), rather than trusting the file extension alone — a renamed
 * `.txt` claiming to be a `.glb` fails here instead of silently
 * "succeeding" and then breaking on the Place Page later, and a real
 * meshopt-compressed asset (the format this app's own captured scans use)
 * validates correctly instead of failing for a decoder that was never
 * registered. Only glTF/GLB and PLY have a real parser available
 * client-side today; splat and other formats fall back to a basic
 * non-empty check, which is honest about the limit rather than pretending
 * to validate something it can't. */
async function validateAsset(buffer: ArrayBuffer, format: ThreeDAssetFormat): Promise<void> {
  if (format === "glb" || format === "gltf") {
    // `three-stdlib` (not `three/examples/jsm`) on purpose — it's the exact
    // same package drei's `useGLTF` pulls these from for `ThreeDViewer`'s
    // real render path, and unlike the jsm version its `DRACOLoader` has no
    // module-level `new URL(...)` reference to the local decoder files, so
    // it doesn't drag ~700KB of decoder assets into the bundle that would
    // never actually be fetched (decoderPath is overridden to the CDN
    // below regardless).
    const { GLTFLoader, DRACOLoader, MeshoptDecoder } = await import("three-stdlib");
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    // Matches drei's own `extensions()` helper exactly: some
    // `three-stdlib` versions export `MeshoptDecoder` as a ready object,
    // others as a factory that returns one.
    loader.setMeshoptDecoder(typeof MeshoptDecoder === "function" ? MeshoptDecoder() : MeshoptDecoder);

    const friendlyError = () => new Error("That doesn't look like a valid glTF/GLB file.");
    try {
      await new Promise<void>((resolve, reject) => {
        // `parse()` throws synchronously for some malformed input (e.g. a
        // renamed non-glTF file that fails its own internal JSON.parse)
        // rather than always going through the async `onError` callback —
        // both paths need to land on the same friendly message rather than
        // surfacing three.js's raw internal parser error to the user.
        try {
          loader.parse(buffer, "", () => resolve(), () => reject(friendlyError()));
        } catch {
          reject(friendlyError());
        }
      });
    } finally {
      dracoLoader.dispose();
    }
    return;
  }
  if (format === "ply") {
    const { PLYLoader } = await import("three/examples/jsm/loaders/PLYLoader.js");
    try {
      new PLYLoader().parse(buffer);
    } catch {
      throw new Error("That doesn't look like a valid PLY file.");
    }
    return;
  }
  if (buffer.byteLength === 0) {
    throw new Error("That file looks empty.");
  }
}

/** Optional 3D scan/asset upload — never blocks submission. Shows a real
 * loading → validating → success/error sequence rather than a fake
 * progress bar, since the validation step above genuinely takes a moment
 * for a large file. */
export function ThreeDUploadField({ asset, onChange, onBusyChange, className }: ThreeDUploadFieldProps) {
  const [status, setStatus] = useState<Status>(asset.kind === "object" ? "success" : "idle");
  const [fileName, setFileName] = useState<string | null>(
    asset.kind === "object" && typeof asset.metadata?.title === "string" ? (asset.metadata.title as string) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = status === "reading" || status === "validating";
  const onBusyChangeRef = useRef(onBusyChange);
  onBusyChangeRef.current = onBusyChange;
  useEffect(() => {
    onBusyChangeRef.current?.(busy);
  }, [busy]);

  async function handleFile(file: File) {
    setFileName(file.name);
    setError(null);
    setStatus("reading");
    const format = detectFormat(file.name);
    try {
      const buffer = await file.arrayBuffer();
      setStatus("validating");
      await validateAsset(buffer, format);
      const url = URL.createObjectURL(file);
      onChange({ kind: "object", format, source: url, metadata: { title: file.name } });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    }
  }

  function clear() {
    if (asset.kind === "object") URL.revokeObjectURL(asset.source);
    onChange({ kind: "none" });
    setStatus("idle");
    setFileName(null);
    setError(null);
  }

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-0.5">
        <p className="font-display text-sm text-text">3D scan</p>
        <p className="font-body text-xs text-text-faint">Optional — GLB, glTF, PLY, or a Gaussian splat.</p>
      </div>

      {status === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-[10px] border border-dashed border-pill-border py-4 font-body text-xs text-text-faint transition-colors hover:border-text-faint hover:text-text"
        >
          <CubeIcon />
          Upload a 3D file
        </button>
      )}

      {busy && (
        <div className="flex items-center gap-2.5 rounded-[10px] bg-surface-row px-4 py-3.5">
          <LoadingSpinner className="size-4 text-accent" />
          <span className="min-w-0 flex-1 truncate font-body text-xs text-text-soft">
            {status === "reading" ? "Reading" : "Validating"} {fileName}…
          </span>
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-2.5 rounded-[10px] bg-surface-row px-4 py-3.5">
          <CheckIcon />
          <span className="min-w-0 flex-1 truncate font-body text-xs text-text">{fileName}</span>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 font-body text-[11px] text-text-faint underline decoration-dotted underline-offset-4 hover:text-text"
          >
            Remove
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-2 rounded-[10px] bg-surface-row px-4 py-3.5">
          <p className="font-body text-xs text-do">{error}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="self-start font-body text-[11px] text-text-faint underline decoration-dotted underline-offset-4 hover:text-text"
          >
            Try a different file
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf,.ply,.splat,.spz,.ksplat"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}

function CubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M4 6.5L12 11l8-4.5M12 11v11" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-accent">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
