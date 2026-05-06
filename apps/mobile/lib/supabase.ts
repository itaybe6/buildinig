import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeSupabaseClient } from "@my-project/supabase";
import { getExpoExtra } from "../src/theme/getExpoExtra";

const extra = getExpoExtra();

const url =
  extra.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";
const key =
  extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!url || !key) {
  console.warn(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Check branding/<Client>/.env."
  );
}

export const supabase = createNativeSupabaseClient(url, key, AsyncStorage);

/**
 * Returns the active tenant id (BUSINESS_ID).
 * Reads from Constants.expoConfig.extra (set by app.config.js) with env fallback.
 *
 * Throws if missing — every multi-tenant query must have one.
 */
export function getBusinessId(): string {
  const id =
    extra.BUSINESS_ID ||
    process.env.EXPO_PUBLIC_BUSINESS_ID ||
    "";
  if (!id) {
    throw new Error(
      "[white-label] BUSINESS_ID is not set. Add it to branding/<Client>/.env"
    );
  }
  return id;
}

/**
 * Like getBusinessId but does not throw — returns null when missing.
 * Useful for code paths that may run before branding is fully wired.
 */
export function tryGetBusinessId(): string | null {
  try {
    return getBusinessId();
  } catch {
    return null;
  }
}
