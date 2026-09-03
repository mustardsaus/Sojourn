import { useRef } from "react";
import clsx from "clsx";
import type { LocationImage } from "@/types/location";

interface ImageUploadFieldProps {
  images: LocationImage[];
  onChange: (images: LocationImage[]) => void;
  className?: string;
}

export const MAX_IMAGES = 3;

/** Derives `order`/`isThumbnail` from array position every time — the first
 * image is always the thumbnail, per the spec ("if reordering is
 * implemented, the first image in the final ordering becomes the
 * thumbnail"). There's deliberately no separate "make thumbnail" control:
 * reordering *is* how you change the thumbnail. */
function reindex(images: LocationImage[]): LocationImage[] {
  return images.map((image, index) => ({ ...image, order: index, isThumbnail: index === 0 }));
}

/** Required 1-3 photo upload. Client-only (no backend to upload to), so
 * "uploading" just means reading the file into a blob URL via
 * `URL.createObjectURL` — good enough for this session's in-memory
 * location store, and cheap to swap for a real upload later since callers
 * only ever see the resulting `LocationImage[]`. */
export function ImageUploadField({ images, onChange, className }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const remainingSlots = MAX_IMAGES - images.length;

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, Math.max(0, remainingSlots));
    const additions: LocationImage[] = files.map((file, i) => ({
      id: `img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      url: URL.createObjectURL(file),
      isThumbnail: false,
      order: images.length + i,
    }));
    if (additions.length > 0) onChange(reindex([...images, ...additions]));
  }

  function removeImage(id: string) {
    const target = images.find((image) => image.id === id);
    if (target) URL.revokeObjectURL(target.url);
    onChange(reindex(images.filter((image) => image.id !== id)));
  }

  function move(id: string, direction: -1 | 1) {
    const index = images.findIndex((image) => image.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    onChange(reindex(reordered));
  }

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-sm text-text">Photos</p>
        <p className="font-body text-xs text-text-faint">
          {images.length} of {MAX_IMAGES} photos added
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {images.map((image, i) => (
          <div key={image.id} className="relative aspect-square overflow-hidden rounded-[10px] bg-surface-row">
            <img src={image.url} alt="" className="size-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-scrim px-2 py-0.5 font-accent text-[9px] font-medium text-text backdrop-blur-sm">
                Thumbnail
              </span>
            )}
            <button
              type="button"
              onClick={() => removeImage(image.id)}
              aria-label="Remove photo"
              className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-scrim text-text backdrop-blur-sm"
            >
              <CloseIcon />
            </button>
            {images.length > 1 && (
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(image.id, -1)}
                  aria-label="Move earlier"
                  className="flex size-5 items-center justify-center rounded-full bg-scrim text-text backdrop-blur-sm disabled:opacity-30"
                >
                  <ChevronIcon direction="left" />
                </button>
                <button
                  type="button"
                  disabled={i === images.length - 1}
                  onClick={() => move(image.id, 1)}
                  aria-label="Move later"
                  className="flex size-5 items-center justify-center rounded-full bg-scrim text-text backdrop-blur-sm disabled:opacity-30"
                >
                  <ChevronIcon direction="right" />
                </button>
              </div>
            )}
          </div>
        ))}

        {remainingSlots > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-pill-border text-text-faint transition-colors hover:border-text-faint hover:text-text"
          >
            <PlusIcon />
            <span className="font-body text-[10px]">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
