import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@my-project/supabase";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const MAX_WIDTH = 512;
const JPEG_QUALITY = 0.82;

/**
 * בוחר תמונה מהגלריה, מקטין ודוחס, ומעלה ל-bucket business-logos.
 */
export async function pickCompressAndUploadBusinessLogo(
  client: SupabaseClient<Database>,
  tenantId: string
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return { ok: false, error: "נדרשת הרשאת גישה לגלריה." };
  }

  const pick = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (pick.canceled || !pick.assets?.[0]?.uri) {
    return { ok: false, error: "ביטול בחירה" };
  }

  const uri = pick.assets[0].uri;

  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  const response = await fetch(manipulated.uri);
  const blob = await response.blob();

  const path = `${tenantId}/${Date.now()}.jpg`;
  const { error: upErr } = await client.storage
    .from("business-logos")
    .upload(path, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const {
    data: { publicUrl },
  } = client.storage.from("business-logos").getPublicUrl(path);

  return { ok: true, publicUrl };
}
