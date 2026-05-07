"use client";

import { Button, Input, Label } from "@my-project/ui-web";
import {
  ANNOUNCEMENT_AUDIENCE_LABEL,
  REQUEST_CATEGORY_LABEL,
  REQUEST_STATUS_LABEL,
} from "@my-project/shared";
import type { ResidentBuildingOption } from "@/lib/resident/building-options";
import { compressHubImageFile } from "@/lib/resident/compress-hub-image";
import { uploadResidentHubMedia } from "@/lib/resident/upload-hub-media";
import { createClient } from "@/lib/supabase/client";
import {
  residentCreateAnnouncementAction,
  residentCreateServiceRequestAction,
  type HubActionState,
} from "./resident-hub-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

export type ResidentAnnouncementListItem = {
  id: string;
  title: string;
  body: string;
  created_at: string | null;
  image_urls: string[] | null;
  video_urls: string[] | null;
};

export type ResidentServiceRequestListItem = {
  id: string;
  title: string;
  status: string;
  created_at: string | null;
  reported_by: string;
  image_urls: string[] | null;
  video_urls: string[] | null;
};

type HubTab = "announcements" | "requests";
type ModalPanel = "closed" | "pick" | "announcement" | "request";

const MAX_IMAGES = 2;
const MAX_VIDEOS = 2;

function ActionMessage({ state }: { state: HubActionState | null }) {
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

/** תצוגה מקדימה של קבצים לפני העלאה + הסרה */
function PendingFilePreviews({
  files,
  variant,
  onRemove,
  disabled,
}: {
  files: File[];
  variant: "image" | "video";
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
          {variant === "image" ? (
            <img
              src={objectUrls[i]}
              alt=""
              className="h-24 w-24 rounded-lg border border-input object-cover shadow-sm"
            />
          ) : (
            <video
              src={objectUrls[i]}
              controls
              muted
              playsInline
              className="h-28 max-w-[220px] rounded-lg border border-input bg-black/5 shadow-sm"
            />
          )}
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

function MediaStrip({
  imageUrls,
  videoUrls,
  compact,
}: {
  imageUrls: string[] | null | undefined;
  videoUrls: string[] | null | undefined;
  compact?: boolean;
}) {
  const imgs = imageUrls ?? [];
  const vids = videoUrls ?? [];
  if (!imgs.length && !vids.length) return null;
  return (
    <div
      className={
        compact
          ? "mt-2 flex flex-wrap gap-1"
          : "mt-3 flex flex-wrap gap-2"
      }
    >
      {imgs.map((url) => (
        <a key={url} href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt=""
            className={
              compact
                ? "h-12 w-12 rounded border object-cover"
                : "h-28 w-28 rounded-md border object-cover"
            }
          />
        </a>
      ))}
      {vids.map((url) => (
        <video
          key={url}
          src={url}
          controls
          className={
            compact
              ? "h-16 max-w-[120px] rounded border"
              : "max-h-52 max-w-full rounded-md border"
          }
        />
      ))}
    </div>
  );
}

export function ResidentHubForms({
  buildings,
  businessProfileId,
  currentProfileId,
  announcements,
  serviceRequests,
}: {
  buildings: ResidentBuildingOption[];
  businessProfileId: string;
  currentProfileId: string;
  announcements: ResidentAnnouncementListItem[];
  serviceRequests: ResidentServiceRequestListItem[];
}) {
  const [tab, setTab] = useState<HubTab>("announcements");
  const [modal, setModal] = useState<ModalPanel>("closed");
  const [annState, setAnnState] = useState<HubActionState | null>(null);
  const [reqState, setReqState] = useState<HubActionState | null>(null);
  const [annImages, setAnnImages] = useState<File[]>([]);
  const [annVideos, setAnnVideos] = useState<File[]>([]);
  const [reqImages, setReqImages] = useState<File[]>([]);
  const [reqVideos, setReqVideos] = useState<File[]>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const selectClasses =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const resetAnnMedia = useCallback(() => {
    setAnnImages([]);
    setAnnVideos([]);
  }, []);
  const resetReqMedia = useCallback(() => {
    setReqImages([]);
    setReqVideos([]);
  }, []);

  const closeModal = useCallback(() => {
    setModal("closed");
    setAnnState(null);
    setReqState(null);
    resetAnnMedia();
    resetReqMedia();
  }, [resetAnnMedia, resetReqMedia]);

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

  const uploadVideos = useCallback(
    async (buildingId: string, files: File[]) => {
      const supabase = createClient();
      const urls: string[] = [];
      for (const file of files) {
        const res = await uploadResidentHubMedia(supabase, {
          businessProfileId,
          buildingId,
          blob: file,
          contentType: file.type || "video/mp4",
          kind: "video",
        });
        if (!res.ok) throw new Error(res.error);
        urls.push(res.publicUrl);
      }
      return urls;
    },
    [businessProfileId]
  );

  const onAnnouncementSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const buildingId = String(fd.get("announcement_building_id") ?? "");
      if (!buildingId) return;

      setAnnState(null);
      startTransition(async () => {
        try {
          const imgUrls = await uploadImages(buildingId, annImages);
          const vidUrls = await uploadVideos(buildingId, annVideos);
          fd.set("announcement_image_urls_json", JSON.stringify(imgUrls));
          fd.set("announcement_video_urls_json", JSON.stringify(vidUrls));
          const result = await residentCreateAnnouncementAction(undefined, fd);
          setAnnState(result);
          if (result.ok) {
            form.reset();
            resetAnnMedia();
            router.refresh();
            closeModal();
          }
        } catch (err) {
          setAnnState({
            ok: false,
            message: err instanceof Error ? err.message : "שגיאת העלאה",
          });
        }
      });
    },
    [
      annImages,
      annVideos,
      closeModal,
      resetAnnMedia,
      router,
      uploadImages,
      uploadVideos,
    ]
  );

  const onRequestSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const buildingId = String(fd.get("request_building_id") ?? "");
      if (!buildingId) return;

      setReqState(null);
      startTransition(async () => {
        try {
          const imgUrls = await uploadImages(buildingId, reqImages);
          const vidUrls = await uploadVideos(buildingId, reqVideos);
          fd.set("request_image_urls_json", JSON.stringify(imgUrls));
          fd.set("request_video_urls_json", JSON.stringify(vidUrls));
          const result = await residentCreateServiceRequestAction(undefined, fd);
          setReqState(result);
          if (result.ok) {
            form.reset();
            resetReqMedia();
            router.refresh();
            closeModal();
          }
        } catch (err) {
          setReqState({
            ok: false,
            message: err instanceof Error ? err.message : "שגיאת העלאה",
          });
        }
      });
    },
    [
      closeModal,
      reqImages,
      reqVideos,
      resetReqMedia,
      router,
      uploadImages,
      uploadVideos,
    ]
  );

  const onPickAnnImages = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []).filter((f) =>
        f.type.startsWith("image/")
      );
      setAnnImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
      e.target.value = "";
    },
    []
  );

  const onPickAnnVideos = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []).filter((f) =>
        f.type.startsWith("video/")
      );
      setAnnVideos((prev) => [...prev, ...picked].slice(0, MAX_VIDEOS));
      e.target.value = "";
    },
    []
  );

  const onPickReqImages = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []).filter((f) =>
        f.type.startsWith("image/")
      );
      setReqImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
      e.target.value = "";
    },
    []
  );

  const onPickReqVideos = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []).filter((f) =>
        f.type.startsWith("video/")
      );
      setReqVideos((prev) => [...prev, ...picked].slice(0, MAX_VIDEOS));
      e.target.value = "";
    },
    []
  );

  const removeAnnImage = useCallback((index: number) => {
    setAnnImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeAnnVideo = useCallback((index: number) => {
    setAnnVideos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeReqImage = useCallback((index: number) => {
    setReqImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeReqVideo = useCallback((index: number) => {
    setReqVideos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  if (buildings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        אין דירה משויכת לפרופיל שלך — לא ניתן לפרסם מודעות או לפתוח קריאות. פנה
        למנהל הנכס.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="inline-flex rounded-lg border bg-muted/40 p-1"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "announcements"}
            className={
              tab === "announcements"
                ? "rounded-md bg-background px-4 py-2 text-sm font-medium shadow-sm"
                : "rounded-md px-4 py-2 text-sm text-muted-foreground"
            }
            onClick={() => setTab("announcements")}
          >
            מודעות
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "requests"}
            className={
              tab === "requests"
                ? "rounded-md bg-background px-4 py-2 text-sm font-medium shadow-sm"
                : "rounded-md px-4 py-2 text-sm text-muted-foreground"
            }
            onClick={() => setTab("requests")}
          >
            קריאות שירות
          </button>
        </div>
        <Button
          type="button"
          onClick={() => {
            setModal("pick");
            setAnnState(null);
            setReqState(null);
          }}
        >
          הוסף
        </Button>
      </div>

      {tab === "announcements" ? (
        <section className="space-y-4">
          {!announcements.length ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              אין מודעות להצגה.
            </p>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border bg-card p-4 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">{a.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {a.created_at
                      ? new Date(a.created_at).toLocaleString("he-IL")
                      : ""}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {a.body}
                  </p>
                  <MediaStrip
                    imageUrls={a.image_urls ?? undefined}
                    videoUrls={a.video_urls ?? undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          {!serviceRequests.length ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              אין קריאות שירות בבניין.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">נושא</th>
                    <th className="px-3 py-2 text-start font-medium">סטטוס</th>
                    <th className="px-3 py-2 text-start font-medium">מגיש</th>
                    <th className="px-3 py-2 text-start font-medium">נוצר</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRequests.map((row) => {
                    const hasMedia =
                      (row.image_urls?.length ?? 0) > 0 ||
                      (row.video_urls?.length ?? 0) > 0;
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="px-3 py-2 align-top">
                          <Link
                            href={`/requests/${row.id}`}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {row.title}
                          </Link>
                          {hasMedia ? (
                            <MediaStrip
                              compact
                              imageUrls={row.image_urls ?? undefined}
                              videoUrls={row.video_urls ?? undefined}
                            />
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {REQUEST_STATUS_LABEL[
                            row.status as keyof typeof REQUEST_STATUS_LABEL
                          ] ?? row.status}
                        </td>
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {row.reported_by === currentProfileId
                            ? "את/ה"
                            : "דייר אחר"}
                        </td>
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {row.created_at
                            ? new Date(row.created_at).toLocaleString("he-IL")
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {modal !== "closed" ? (
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
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold">
                {modal === "pick" && "מה להוסיף?"}
                {modal === "announcement" && "פרסום מודעה"}
                {modal === "request" && "פתיחת קריאת שירות"}
              </h2>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={closeModal}
              >
                סגירה
              </button>
            </div>

            {modal === "pick" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-lg border bg-card p-4 text-start shadow-sm hover:bg-muted/50"
                  onClick={() => setModal("announcement")}
                >
                  <span className="font-medium">מודעה לדיירים</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    עדכון או הודעה לבניין.
                  </p>
                </button>
                <button
                  type="button"
                  className="rounded-lg border bg-card p-4 text-start shadow-sm hover:bg-muted/50"
                  onClick={() => setModal("request")}
                >
                  <span className="font-medium">קריאת שירות</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    דיווח לצוות הניהול.
                  </p>
                </button>
              </div>
            ) : null}

            {modal === "announcement" ? (
              <form onSubmit={onAnnouncementSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="announcement_building_id">בניין</Label>
                  <select
                    id="announcement_building_id"
                    name="announcement_building_id"
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
                  <Label htmlFor="announcement_audience">קהל יעד</Label>
                  <select
                    id="announcement_audience"
                    name="announcement_audience"
                    className={selectClasses}
                    defaultValue="residents"
                  >
                    <option value="residents">
                      {ANNOUNCEMENT_AUDIENCE_LABEL.residents}
                    </option>
                    <option value="all">{ANNOUNCEMENT_AUDIENCE_LABEL.all}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="announcement_title">כותרת</Label>
                  <Input
                    id="announcement_title"
                    name="announcement_title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="announcement_body">תוכן</Label>
                  <textarea
                    id="announcement_body"
                    name="announcement_body"
                    required
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label>תמונות (עד {MAX_IMAGES})</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={pending}
                    onChange={onPickAnnImages}
                  />
                  <PendingFilePreviews
                    files={annImages}
                    variant="image"
                    disabled={pending}
                    onRemove={removeAnnImage}
                  />
                </div>

                <div className="space-y-2">
                  <Label>סרטונים (עד {MAX_VIDEOS})</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    multiple
                    disabled={pending}
                    onChange={onPickAnnVideos}
                  />
                  <PendingFilePreviews
                    files={annVideos}
                    variant="video"
                    disabled={pending}
                    onRemove={removeAnnVideo}
                  />
                </div>

                <ActionMessage state={annState} />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={pending}>
                    {pending ? "שולח…" : "פרסום מודעה"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModal("pick")}
                  >
                    חזרה
                  </Button>
                </div>
              </form>
            ) : null}

            {modal === "request" ? (
              <form onSubmit={onRequestSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="request_building_id">בניין</Label>
                  <select
                    id="request_building_id"
                    name="request_building_id"
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
                  <Label htmlFor="request_category">קטגוריה</Label>
                  <select
                    id="request_category"
                    name="request_category"
                    required
                    className={selectClasses}
                    defaultValue="other"
                  >
                    {(Object.keys(REQUEST_CATEGORY_LABEL) as Array<
                      keyof typeof REQUEST_CATEGORY_LABEL
                    >).map((key) => (
                      <option key={key} value={key}>
                        {REQUEST_CATEGORY_LABEL[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request_title">כותרת</Label>
                  <Input id="request_title" name="request_title" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request_description">תיאור (אופציונלי)</Label>
                  <textarea
                    id="request_description"
                    name="request_description"
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label>תמונות (עד {MAX_IMAGES})</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={pending}
                    onChange={onPickReqImages}
                  />
                  <PendingFilePreviews
                    files={reqImages}
                    variant="image"
                    disabled={pending}
                    onRemove={removeReqImage}
                  />
                </div>

                <div className="space-y-2">
                  <Label>סרטונים (עד {MAX_VIDEOS})</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    multiple
                    disabled={pending}
                    onChange={onPickReqVideos}
                  />
                  <PendingFilePreviews
                    files={reqVideos}
                    variant="video"
                    disabled={pending}
                    onRemove={removeReqVideo}
                  />
                </div>

                <ActionMessage state={reqState} />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={pending}>
                    {pending ? "שולח…" : "פתיחת קריאה"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModal("pick")}
                  >
                    חזרה
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
