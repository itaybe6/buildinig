import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@my-project/supabase";

const BUCKET = "resident-hub-media";

function randomPathSegment(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** העלאת תמונה ל-bucket resident-hub-media (אותו נתיב כמו בווב). */
export async function uploadResidentHubImage(
  client: SupabaseClient<Database>,
  params: {
    businessProfileId: string;
    buildingId: string;
    blob: Blob;
    contentType?: string;
  }
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const path = `${params.businessProfileId}/${params.buildingId}/${randomPathSegment()}.jpg`;
  const contentType = params.contentType ?? "image/jpeg";

  const { error: upErr } = await client.storage.from(BUCKET).upload(path, params.blob, {
    contentType,
    upsert: false,
  });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const {
    data: { publicUrl },
  } = client.storage.from(BUCKET).getPublicUrl(path);

  return { ok: true, publicUrl };
}
