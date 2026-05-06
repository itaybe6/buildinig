export type { Database, Json } from "./database.types";
export { createBrowserSupabaseClient } from "./browser";
export { createNativeSupabaseClient } from "./native";
export {
  createServerSupabaseClient,
  type CookieStoreAdapter,
} from "./server";
export type { CookieOptions } from "@supabase/ssr";
