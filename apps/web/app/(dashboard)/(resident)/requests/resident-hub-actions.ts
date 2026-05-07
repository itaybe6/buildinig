"use server";

import { createClient } from "@/lib/supabase/server";
import { getResidentTenantContext } from "@/lib/dashboard/session";
import { getResidentBuildingOptions } from "@/lib/resident/building-options";
import type { Database } from "@my-project/supabase";
import { requestCategorySchema } from "@my-project/shared";
import { revalidatePath } from "next/cache";

type AnnouncementAudience =
  Database["public"]["Enums"]["announcement_audience"];

export type HubActionState =
  | { ok: true; message: string }
  | { ok: false; message: string };

const MAX_IMAGES = 2;
const MAX_VIDEOS = 2;

function parseMediaUrlArray(formData: FormData, key: string): string[] {
  const raw = String(formData.get(key) ?? "[]").trim();
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is string => typeof x === "string" && /^https?:\/\//.test(x)
    );
  } catch {
    return [];
  }
}

function parseAudience(raw: string): AnnouncementAudience {
  if (raw === "residents" || raw === "employees" || raw === "all") return raw;
  return "residents";
}

export async function residentCreateAnnouncementAction(
  _prev: HubActionState | undefined,
  formData: FormData
): Promise<HubActionState> {
  const ctx = await getResidentTenantContext();
  if (!ctx.ok) return { ok: false, message: "אין הרשאת תושב." };

  const title = String(formData.get("announcement_title") ?? "").trim();
  const body = String(formData.get("announcement_body") ?? "").trim();
  const buildingId = String(formData.get("announcement_building_id") ?? "").trim();
  const audience = parseAudience(
    String(formData.get("announcement_audience") ?? "residents")
  );

  if (!title || !body) {
    return { ok: false, message: "נא למלא כותרת ותוכן." };
  }
  if (!buildingId) {
    return { ok: false, message: "נא לבחור בניין." };
  }

  const supabase = createClient();
  const options = await getResidentBuildingOptions(supabase, {
    profileId: ctx.profile.profileId,
    businessProfileId: ctx.businessProfileId,
  });
  if (!options.some((o) => o.buildingId === buildingId)) {
    return { ok: false, message: "הבניין שנבחר אינו משויך לדירה שלך." };
  }

  const imageCandidates = parseMediaUrlArray(
    formData,
    "announcement_image_urls_json"
  );
  const videoCandidates = parseMediaUrlArray(
    formData,
    "announcement_video_urls_json"
  );
  if (imageCandidates.length > MAX_IMAGES || videoCandidates.length > MAX_VIDEOS) {
    return {
      ok: false,
      message: `ניתן לצרף עד ${MAX_IMAGES} תמונות ועד ${MAX_VIDEOS} סרטונים.`,
    };
  }
  const imageUrls = imageCandidates;
  const videoUrls = videoCandidates;

  const { error } = await supabase.from("announcements").insert({
    building_id: buildingId,
    created_by: ctx.profile.profileId,
    title,
    body,
    audience,
    is_pinned: false,
    image_urls: imageUrls.length ? imageUrls : null,
    video_urls: videoUrls.length ? videoUrls : null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/requests");
  return { ok: true, message: "המודעה פורסמה." };
}

export async function residentCreateServiceRequestAction(
  _prev: HubActionState | undefined,
  formData: FormData
): Promise<HubActionState> {
  const ctx = await getResidentTenantContext();
  if (!ctx.ok) return { ok: false, message: "אין הרשאת תושב." };

  const title = String(formData.get("request_title") ?? "").trim();
  const description = String(formData.get("request_description") ?? "").trim();
  const buildingId = String(formData.get("request_building_id") ?? "").trim();
  const categoryRaw = String(formData.get("request_category") ?? "").trim();

  const parsed = requestCategorySchema.safeParse(categoryRaw);
  if (!title) {
    return { ok: false, message: "נא למלא כותרת לקריאה." };
  }
  if (!buildingId) {
    return { ok: false, message: "נא לבחור בניין." };
  }
  if (!parsed.success) {
    return { ok: false, message: "נא לבחור קטגוריית שירות." };
  }

  const supabase = createClient();
  const options = await getResidentBuildingOptions(supabase, {
    profileId: ctx.profile.profileId,
    businessProfileId: ctx.businessProfileId,
  });
  const match = options.find((o) => o.buildingId === buildingId);
  if (!match) {
    return { ok: false, message: "הבניין שנבחר אינו משויך לדירה שלך." };
  }

  const imageCandidates = parseMediaUrlArray(formData, "request_image_urls_json");
  const videoCandidates = parseMediaUrlArray(formData, "request_video_urls_json");
  if (imageCandidates.length > MAX_IMAGES || videoCandidates.length > MAX_VIDEOS) {
    return {
      ok: false,
      message: `ניתן לצרף עד ${MAX_IMAGES} תמונות ועד ${MAX_VIDEOS} סרטונים.`,
    };
  }
  const imageUrls = imageCandidates;
  const videoUrls = videoCandidates;

  const { error } = await supabase.from("service_requests").insert({
    building_id: buildingId,
    unit_id: match.unitId,
    reported_by: ctx.profile.profileId,
    title,
    description: description || null,
    category: parsed.data,
    status: "open",
    priority: "medium",
    image_urls: imageUrls.length ? imageUrls : null,
    video_urls: videoUrls.length ? videoUrls : null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/requests");
  return { ok: true, message: "הקריאה נוצרה." };
}
