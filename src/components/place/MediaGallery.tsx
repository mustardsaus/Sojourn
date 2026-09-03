import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { sortImagesByOrder } from "@/lib/media";
import type { LocationImage } from "@/types/location";

interface MediaGalleryProps {
  images: LocationImage[];
  name: string;
  className?: string;
}

/** The photo half of a location's media — a single image with no chrome,
 * or (once there's more than one) a lightweight tap-to-advance carousel
 * with a dot indicator. Kept deliberately simple: no drag/swipe library,
 * just a soft crossfade between frames, consistent with the restrained
 * motion language used everywhere else in the app.
 *
 * This never disappears just because a location also has a 3D asset —
 * `PlaceDetailCard` toggles between this and `ThreeDViewer`, but the photo
 * content itself always stays fully intact underneath that toggle. */
export function MediaGallery({ images, name, className }: MediaGalleryProps) {
  const sorted = useMemo(() => sortImagesByOrder(images), [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= sorted.length) setIndex(0);
  }, [sorted.length, index]);

  const active = sorted[index] ?? sorted[0];
  if (!active) return null;

  return (
    <div className={clsx("relative overflow-hidden", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={active.id}
          src={active.url}
          alt={name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 size-full cursor-pointer object-cover"
          onClick={() => sorted.length > 1 && setIndex((i) => (i + 1) % sorted.length)}
        />
      </AnimatePresence>

      {sorted.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1.5">
          {sorted.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1} of ${sorted.length}`}
              className={clsx(
                "pointer-events-auto h-1.5 rounded-full bg-white transition-all duration-300",
                i === index ? "w-4 opacity-95" : "w-1.5 opacity-50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
