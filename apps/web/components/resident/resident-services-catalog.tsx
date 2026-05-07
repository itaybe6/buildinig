"use client";

import type { ResidentBuildingOption } from "@/lib/resident/building-options";
import { compressHubImageFile } from "@/lib/resident/compress-hub-image";
import { uploadResidentHubMedia } from "@/lib/resident/upload-hub-media";
import { createClient } from "@/lib/supabase/client";
import {
  residentCreateQuoteRequestAction,
  type QuoteRequestActionState,
} from "@/app/(dashboard)/(resident)/quotes/resident-quote-request-actions";
import { Button, Input, Label } from "@my-project/ui-web";
import { formatILS, validateResidentProposedAmount } from "@my-project/shared";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

export type ResidentCatalogService = {
  id: string;
  name: string;
  description: string | null;
  price_min: string | null;
  price_max: string | null;
};

const MAX_IMAGES = 4;

function formatPriceRange(
  priceMin: string | null,
  priceMax: string | null
): string {
  const lo = priceMin != null && priceMin !== "" ? Number(priceMin) : null;
  const hi = priceMax != null && priceMax !== "" ? Number(priceMax) : null;
  const loOk = lo != null && Number.isFinite(lo);
  const hiOk = hi != null && Number.isFinite(hi);
  if (loOk && hiOk) {
    return `${formatILS(lo)} – ${formatILS(hi)}`;
  }
  if (loOk) {
    return `מ-${formatILS(lo)}`;
  }
  if (hiOk) {
    return `עד ${formatILS(hi)}`;
  }
  return "כל מחיר חיובי";
}

/** הנחיה ליד שדה המחיר — בהירות לגבי הטווח המותר */
function priceInputHint(
  priceMin: string | null,
  priceMax: string | null
): string {
  const lo =
    priceMin != null && priceMin !== "" ? Number(priceMin) : null;
  const hi =
    priceMax != null && priceMax !== "" ? Number(priceMax) : null;
  const loOk = lo != null && Number.isFinite(lo);
  const hiOk = hi != null && Number.isFinite(hi);
  if (loOk && hiOk) {
    return `יש להזין סכום בין ${formatILS(lo)} ל-${formatILS(hi)} (כולל הקצוות).`;
  }
  if (loOk) {
    return `יש להזין סכום של לפחות ${formatILS(lo)}.`;
  }
  if (hiOk) {
    return `יש להזין סכום של עד ${formatILS(hi)}.`;
  }
  return "יש להזין מחיר חיובי.";
}

function ActionMessage({ state }: { state: QuoteRequestActionState | null }) {
  if (!state?.message) return null;
  return (
    <p
      className={
        state.ok ? "text-sm text-green-700" : "text-sm text-destructive"
      }
      role="status"
    >
      {state.message}
    </p>
  );
}

function PendingQuoteImages({
  files,
  onRemove,
  disabled,
}: {
  files: File[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  const objectUrls = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files]
  );

  useEffect(() => {
    return () => {
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [objectUrls]);

  if (!files.length) return null;

  return (
    <ul className="mt-2 flex flex-wrap gap-3" aria-live="polite">
      {files.map((file, i) => (
        <li
          key={`${file.name}-${file.lastModified}-${i}`}
          className="relative shrink-0"
        >
          <img
            src={objectUrls[i]}
            alt=""
            className="h-24 w-24 rounded-lg border border-input object-cover shadow-sm"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(i)}
            className="absolute start-1 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-input bg-background text-base leading-none text-foreground shadow-md hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            aria-label="הסרת קובץ"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ResidentServicesCatalog({
  services,
  buildings,
  businessProfileId,
}: {
  services: ResidentCatalogService[];
  buildings: ResidentBuildingOption[];
  businessProfileId: string;
}) {
  const [modalService, setModalService] = useState<ResidentCatalogService | null>(
    null
  );
  const [quoteImages, setQuoteImages] = useState<File[]>([]);
  const [quoteState, setQuoteState] = useState<QuoteRequestActionState | null>(
    null
  );
  const [proposedPriceInput, setProposedPriceInput] = useState("");
  const [priceFieldError, setPriceFieldError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const selectClasses =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const closeModal = useCallback(() => {
    setModalService(null);
    setQuoteImages([]);
    setQuoteState(null);
    setProposedPriceInput("");
    setPriceFieldError(null);
  }, []);

  const uploadImages = useCallback(
    async (buildingId: string, files: File[]) => {
      const supabase = createClient();
      const urls: string[] = [];
      for (const file of files) {
        const blob = await compressHubImageFile(file);
        const res = await uploadResidentHubMedia(supabase, {
          businessProfileId,
          buildingId,
          blob,
          contentType: "image/jpeg",
          kind: "image",
        });
        if (!res.ok) throw new Error(res.error);
        urls.push(res.publicUrl);
      }
      return urls;
    },
    [businessProfileId]
  );

  const onQuoteSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const buildingId = String(fd.get("quote_building_id") ?? "");
      if (!buildingId || !modalService) return;

      const raw = proposedPriceInput.trim().replace(",", ".");
      const proposed = Number(raw);
      const priceCheck = validateResidentProposedAmount(proposed, {
        priceMin: modalService.price_min,
        priceMax: modalService.price_max,
      });
      if (!priceCheck.ok) {
        setPriceFieldError(priceCheck.message);
        setQuoteState(null);
        return;
      }
      setPriceFieldError(null);

      fd.set("quote_proposed_amount", raw);

      setQuoteState(null);
      startTransition(async () => {
        try {
          const imgUrls = await uploadImages(buildingId, quoteImages);
          fd.set("quote_image_urls_json", JSON.stringify(imgUrls));
          const result = await residentCreateQuoteRequestAction(undefined, fd);
          setQuoteState(result);
          if (result.ok) {
            form.reset();
            setQuoteImages([]);
            setProposedPriceInput("");
            router.refresh();
            closeModal();
          }
        } catch (err) {
          setQuoteState({
            ok: false,
            message: err instanceof Error ? err.message : "שגיאת העלאה",
          });
        }
      });
    },
    [
      closeModal,
      modalService,
      proposedPriceInput,
      quoteImages,
      router,
      uploadImages,
    ]
  );

  const onPickQuoteImages = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []).filter((f) =>
        f.type.startsWith("image/")
      );
      setQuoteImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
      e.target.value = "";
    },
    []
  );

  const removeQuoteImage = useCallback((index: number) => {
    setQuoteImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  if (buildings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        אין דירה משויכת לפרופיל שלך — לא ניתן להגיש הצעות מחיר. פנה למנהל
        הנכס.
      </p>
    );
  }

  return (
    <>
      {!services.length ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          אין שירותים זמינים להצגה.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">שירות</th>
                <th className="px-3 py-2 text-start font-medium">טווח מחיר</th>
                <th className="px-3 py-2 text-start font-medium w-[140px]" />
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-3 py-3 align-top">
                    <p className="font-medium">{s.name}</p>
                    {s.description ? (
                      <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                        {s.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 align-top text-muted-foreground">
                    {formatPriceRange(s.price_min, s.price_max)}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuoteState(null);
                        setQuoteImages([]);
                        setProposedPriceInput("");
                        setPriceFieldError(null);
                        setModalService(s);
                      }}
                    >
                      הגש הצעת מחיר
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalService ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(ev) => {
            if (ev.target === ev.currentTarget) closeModal();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-background p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-modal-title"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h2
                  id="quote-modal-title"
                  className="text-lg font-semibold"
                >
                  הצעת מחיר — {modalService.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  טווח מחיר מוצע:{" "}
                  {formatPriceRange(
                    modalService.price_min,
                    modalService.price_max
                  )}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={closeModal}
              >
                סגירה
              </button>
            </div>

            <form onSubmit={onQuoteSubmit} className="space-y-4">
              <input type="hidden" name="quote_service_type_id" value={modalService.id} />

              <div className="space-y-2">
                <Label htmlFor="quote_building_id">בניין</Label>
                <select
                  id="quote_building_id"
                  name="quote_building_id"
                  required
                  className={selectClasses}
                  defaultValue={buildings[0]?.buildingId ?? ""}
                >
                  {buildings.map((b) => (
                    <option key={b.buildingId} value={b.buildingId}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote_description">תיאור הבקשה</Label>
                <textarea
                  id="quote_description"
                  name="quote_description"
                  required
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote_proposed_amount">מחיר מוצע (₪)</Label>
                <p
                  id="quote_proposed_amount_hint"
                  className="text-sm text-muted-foreground"
                >
                  {priceInputHint(
                    modalService.price_min,
                    modalService.price_max
                  )}
                </p>
                <Input
                  id="quote_proposed_amount"
                  name="quote_proposed_amount"
                  type="text"
                  inputMode="decimal"
                  required
                  value={proposedPriceInput}
                  onChange={(ev) => {
                    setProposedPriceInput(ev.target.value);
                    setPriceFieldError(null);
                  }}
                  placeholder="למשל 1500"
                  aria-describedby={`quote_proposed_amount_hint${
                    priceFieldError ? " quote_proposed_amount_err" : ""
                  }`}
                  aria-invalid={priceFieldError ? true : undefined}
                  className={
                    priceFieldError
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                />
                {priceFieldError ? (
                  <p
                    id="quote_proposed_amount_err"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {priceFieldError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>תמונות (עד {MAX_IMAGES})</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={pending}
                  onChange={onPickQuoteImages}
                />
                <PendingQuoteImages
                  files={quoteImages}
                  disabled={pending}
                  onRemove={removeQuoteImage}
                />
              </div>

              <ActionMessage state={quoteState} />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "שולח…" : "שליחת בקשה"}
                </Button>
                <Button type="button" variant="outline" onClick={closeModal}>
                  ביטול
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
