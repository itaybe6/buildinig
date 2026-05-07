"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@my-project/supabase";

const BUCKET = "resident-hub-media";

function extForMime(mime: string, kind: "image" | "video"): string {
  if (kind === "image") return ".jpg";
  if (mime.includes("webm")) return ".webm";
  if (mime.includes("quicktime")) return ".mov";
  return ".mp4";
}

export async function uploadResidentHubMedia(
  supabase: SupabaseClient<Database>,
  params: {
    businessProfileId: string;
    buildingId: string;
    blob: Blob;
    contentType: string;
    kind: "image" | "video";
  }
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const ext = extForMime(params.contentType, params.kind);
  const path = `${params.businessProfileId}/${params.buildingId}/${crypto.randomUUID()}${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, params.blob, {
      contentType: params.contentType,
      upsert: false,
    });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { ok: true, publicUrl };
}
