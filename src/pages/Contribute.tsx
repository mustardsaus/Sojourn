import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Header } from "@/components/layout/Header";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AdiScoreInput } from "@/components/contribute/AdiScoreInput";
import { ImageUploadField } from "@/components/contribute/ImageUploadField";
import { ThreeDUploadField } from "@/components/contribute/ThreeDUploadField";
import { LocationPreviewMap } from "@/components/contribute/LocationPreviewMap";
import { RevealSection } from "@/components/contribute/RevealSection";
import { useGoogleMapsLinkResolver } from "@/hooks/useGoogleMapsLinkResolver";
import { locationRepository } from "@/data/repository";
import { categoryConfig, topLevelCategories, getCategoryColor } from "@/config/categories";
import type {
  LocationDraft,
  LocationImage,
  LocationNotes,
  SecondLevelCategory,
  ThreeDAsset,
  TopLevelCategory,
} from "@/types/location";

type BestTime = Extract<LocationNotes, { kind: "to-see" }>["bestTime"];

/** Builds the discriminated `LocationNotes` payload for the currently
 * selected category out of the two plain pieces of local state below (a
 * free-text draft and a single-select value) — the one place this file
 * needs a per-category switch, mirroring the same shape `categoryConfig`'s
 * own `emptyNotes()` already uses. Everything else about the dynamic form
 * (which fields to show, their labels/options) comes straight out of
 * `categoryConfig`. */
function buildNotes(
  topLevelCategory: TopLevelCategory,
  textValue: string,
  selectValue: string | undefined,
): LocationNotes | null {
  const trimmed = textValue.trim();
  if (topLevelCategory === "to-eat") return trimmed ? { kind: "to-eat", youJustGotta: trimmed } : null;
  if (topLevelCategory === "to-do") return trimmed ? { kind: "to-do", whatIsIt: trimmed } : null;
  if (selectValue) return { kind: "to-see", bestTime: selectValue as BestTime };
  return null;
}

export function Contribute() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const { status: linkStatus, coordinates, error: linkError } = useGoogleMapsLinkResolver(mapsUrl);

  const [topLevelCategory, setTopLevelCategory] = useState<TopLevelCategory | undefined>();
  const [secondLevelCategory, setSecondLevelCategory] = useState<SecondLevelCategory | undefined>();
  const [notesText, setNotesText] = useState("");
  const [bestTime, setBestTime] = useState<string | undefined>();

  const [adiScore, setAdiScore] = useState(0);
  const [images, setImages] = useState<LocationImage[]>([]);
  const [threeDAsset, setThreeDAsset] = useState<ThreeDAsset>({ kind: "none" });
  const [threeDUploadBusy, setThreeDUploadBusy] = useState(false);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function chooseTopLevelCategory(next: TopLevelCategory) {
    if (next === topLevelCategory) return;
    setTopLevelCategory(next);
    setSecondLevelCategory(undefined);
    setNotesText("");
    setBestTime(undefined);
  }

  const nameReady = name.trim().length > 0;
  const linkResolved = linkStatus === "resolved" && coordinates !== null;
  const categoryConfigForSelection = topLevelCategory ? categoryConfig[topLevelCategory] : undefined;
  const notesComplete =
    !!topLevelCategory &&
    (categoryConfigForSelection?.notesField.type === "select" ? Boolean(bestTime) : notesText.trim().length > 0);
  const secondLevelReady = Boolean(secondLevelCategory);
  const scoreReady = adiScore > 0;
  const imagesReady = images.length >= 1;

  const showLink = nameReady;
  const showCategory = showLink && linkResolved;
  const showSecondLevel = showCategory && Boolean(topLevelCategory);
  const showNotes = showSecondLevel && secondLevelReady;
  const showScore = showNotes && notesComplete;
  const showImages = showScore && scoreReady;
  const showTail = showImages && imagesReady;

  const canSubmit =
    nameReady &&
    linkResolved &&
    !!topLevelCategory &&
    secondLevelReady &&
    notesComplete &&
    scoreReady &&
    imagesReady &&
    images.length <= 3 &&
    !threeDUploadBusy &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit || !coordinates || !topLevelCategory || !secondLevelCategory) return;
    const notes = buildNotes(topLevelCategory, notesText, bestTime);
    if (!notes) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const draft: LocationDraft = {
        name: name.trim(),
        coordinates,
        googleMapsUrl: mapsUrl.trim(),
        topLevelCategory,
        secondLevelCategory,
        images,
        threeDAsset,
        adiScore,
        notes,
        description: description.trim() || undefined,
      };
      const created = await locationRepository.create(draft);
      navigate(`/place/${created.id}`);
    } catch {
      setSubmitError("Something went wrong saving this place — try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 bg-bg px-6 pb-16 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <Header titleBeforeAccent="Add to your" />

      <p className="-mt-4 font-body text-sm leading-relaxed text-text-faint">
        Gradually document a new discovery for your personal map — a name and a link is all it takes to start.
      </p>

      <div className="flex flex-col gap-7">
        {/* STEP 1 — Name */}
        <FieldLabel>Name</FieldLabel>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Villa Crespi"
          autoFocus
          className="-mt-5 w-full border-b border-line bg-transparent pb-2.5 font-display text-3xl text-text placeholder:text-text-faint/50 focus:border-accent focus:outline-none"
        />

        {/* STEP 2 — Google Maps link + validation */}
        <RevealSection show={showLink}>
          <div className="flex flex-col gap-2.5">
            <FieldLabel>Google Maps Link</FieldLabel>
            <input
              type="url"
              inputMode="url"
              value={mapsUrl}
              onChange={(event) => setMapsUrl(event.target.value)}
              placeholder="https://maps.google.com/…"
              className="w-full border-b border-line bg-transparent pb-2.5 font-display text-base text-text placeholder:text-text-faint/50 focus:border-accent focus:outline-none"
            />

            <AnimatePresence mode="wait" initial={false}>
              {linkStatus === "resolving" && (
                <motion.div
                  key="resolving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 pt-1 font-body text-xs text-text-faint"
                >
                  <LoadingSpinner className="size-3.5 text-accent" />
                  Finding this place…
                </motion.div>
              )}
              {linkStatus === "error" && linkError && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="pt-1 font-body text-xs text-do"
                >
                  {linkError}
                </motion.p>
              )}
              {linkResolved && coordinates && (
                <motion.div
                  key="resolved"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-2 pt-1"
                >
                  <LocationPreviewMap coordinates={coordinates} className="h-28 w-full" />
                  <p className="font-body text-xs text-text-faint">
                    Recognized — {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </RevealSection>

        {/* STEP 3 — Primary category */}
        <RevealSection show={showCategory}>
          <div className="flex flex-col gap-2.5">
            <FieldLabel>Primary Category</FieldLabel>
            <div className="grid grid-cols-3 gap-2.5">
              {topLevelCategories.map((cat) => {
                const active = cat.value === topLevelCategory;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => chooseTopLevelCategory(cat.value)}
                    className={clsx(
                      "relative isolate flex flex-col items-center gap-1.5 overflow-hidden rounded-[14px] border py-5 font-display text-sm transition-colors",
                      active ? "border-transparent text-white" : "border-pill-border bg-pill text-text",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="contribute-category-active"
                        className="absolute inset-0 -z-10"
                        style={{ backgroundColor: cat.color }}
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    )}
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </RevealSection>

        {/* STEP 4/5 — Second-level category + category-specific notes,
            re-keyed on the chosen category so switching categories mid-flow
            transitions the whole block rather than mutating it in place. */}
        <AnimatePresence mode="wait" initial={false}>
          {topLevelCategory && categoryConfigForSelection && (
            <motion.div
              key={topLevelCategory}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-7"
            >
              <RevealSection show={showSecondLevel}>
                <div className="flex flex-col gap-2.5">
                  <FieldLabel>{categoryConfig[topLevelCategory].label} — Category</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {categoryConfigForSelection.secondLevelCategories.map((option) => {
                      const active = option.value === secondLevelCategory;
                      const color = getCategoryColor(topLevelCategory);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSecondLevelCategory(option.value as SecondLevelCategory)}
                          style={active ? { backgroundColor: color, borderColor: color } : undefined}
                          className={clsx(
                            "rounded-full border px-4 py-2 font-accent text-xs transition-colors",
                            active ? "text-white" : "border-pill-border bg-pill text-text hover:border-text-faint",
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </RevealSection>

              <RevealSection show={showNotes}>
                <NotesInput
                  field={categoryConfigForSelection.notesField}
                  textValue={notesText}
                  onTextChange={setNotesText}
                  selectValue={bestTime}
                  onSelectChange={setBestTime}
                  color={getCategoryColor(topLevelCategory)}
                />
              </RevealSection>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Adi Score — mandatory */}
        <RevealSection show={showScore}>
          <div className="flex flex-col gap-2.5">
            <FieldLabel>Adi Score</FieldLabel>
            <AdiScoreInput value={adiScore} onChange={setAdiScore} />
          </div>
        </RevealSection>

        {/* Images — mandatory, 1-3 */}
        <RevealSection show={showImages}>
          <ImageUploadField images={images} onChange={setImages} />
        </RevealSection>

        {/* Tail: optional 3D asset, optional remaining details, review/submit */}
        <RevealSection show={showTail}>
          <div className="flex flex-col gap-7">
            <ThreeDUploadField asset={threeDAsset} onChange={setThreeDAsset} onBusyChange={setThreeDUploadBusy} />

            <div className="flex flex-col gap-2.5">
              <FieldLabel>Anything else?</FieldLabel>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Any other detail worth remembering about this place."
                rows={3}
                className="w-full resize-none rounded-[10px] border border-line bg-surface-row px-4 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
              />
            </div>

            <ReviewSummary
              name={name}
              topLevelCategory={topLevelCategory}
              secondLevelCategory={secondLevelCategory}
              notesText={notesText}
              bestTime={bestTime}
              adiScore={adiScore}
              images={images}
              hasThreeD={threeDAsset.kind !== "none"}
            />

            {submitError && <p className="font-body text-xs text-do">{submitError}</p>}
            {threeDUploadBusy && (
              <p className="font-body text-xs text-text-faint">Finishing up the 3D file before you can submit…</p>
            )}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="flex items-center justify-center gap-2 rounded-[12px] border border-accent-soft bg-accent py-3.5 font-display text-sm text-white shadow-sm transition-transform active:scale-[0.985] disabled:opacity-40"
            >
              {(submitting || threeDUploadBusy) && <LoadingSpinner className="size-4 text-white" />}
              {submitting ? "Adding…" : "Add Location"}
            </button>
          </div>
        </RevealSection>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="font-body text-[10px] font-medium uppercase tracking-wide text-text-faint">{children}</p>;
}

interface NotesFieldConfigLike {
  type: "text" | "select";
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

function NotesInput({
  field,
  textValue,
  onTextChange,
  selectValue,
  onSelectChange,
  color,
}: {
  field: NotesFieldConfigLike;
  textValue: string;
  onTextChange: (value: string) => void;
  selectValue: string | undefined;
  onSelectChange: (value: string) => void;
  color: string;
}) {
  if (field.type === "text") {
    return (
      <div className="flex flex-col gap-2.5">
        <p className="font-display text-sm text-text">{field.label}</p>
        <textarea
          value={textValue}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="w-full resize-none rounded-[10px] border border-line bg-surface-row px-4 py-3.5 font-body text-sm leading-relaxed text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="font-display text-sm text-text">{field.label}</p>
      <div className="flex flex-wrap gap-2">
        {field.options?.map((option) => {
          const active = option.value === selectValue;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectChange(option.value)}
              style={active ? { backgroundColor: color, borderColor: color } : undefined}
              className={clsx(
                "rounded-full border px-4 py-2 font-accent text-xs transition-colors",
                active ? "text-white" : "border-pill-border bg-pill text-text hover:border-text-faint",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewSummary({
  name,
  topLevelCategory,
  secondLevelCategory,
  notesText,
  bestTime,
  adiScore,
  images,
  hasThreeD,
}: {
  name: string;
  topLevelCategory?: TopLevelCategory;
  secondLevelCategory?: SecondLevelCategory;
  notesText: string;
  bestTime?: string;
  adiScore: number;
  images: LocationImage[];
  hasThreeD: boolean;
}) {
  if (!topLevelCategory) return null;
  const config = categoryConfig[topLevelCategory];
  const secondLabel = config.secondLevelCategories.find((o) => o.value === secondLevelCategory)?.label;
  const noteDisplay =
    config.notesField.type === "select"
      ? config.notesField.options.find((o) => o.value === bestTime)?.label
      : notesText;

  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-surface-row p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-lg text-text">{name}</p>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 font-accent text-[10px] font-medium text-white"
          style={{ backgroundColor: getCategoryColor(topLevelCategory) }}
        >
          {config.label} · {secondLabel}
        </span>
      </div>
      {noteDisplay && <p className="font-body text-xs leading-relaxed text-text-soft">{noteDisplay}</p>}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarDot key={i} filled={i < Math.round(adiScore)} />
        ))}
        <span className="ml-1 font-body text-xs text-text-faint">{adiScore.toFixed(1)} Adi Score</span>
      </div>
      <div className="flex items-center gap-2">
        {images.map((image) => (
          <div key={image.id} className="size-12 shrink-0 overflow-hidden rounded-[8px]">
            <img src={image.url} alt="" className="size-full object-cover" />
          </div>
        ))}
        {hasThreeD && (
          <span className="ml-1 rounded-full bg-pill px-2.5 py-1 font-accent text-[10px] text-text">
            + 3D scan
          </span>
        )}
      </div>
    </div>
  );
}

function StarDot({ filled }: { filled: boolean }) {
  return <span className={clsx("size-1.5 rounded-full", filled ? "bg-accent" : "bg-text-faint/30")} />;
}
