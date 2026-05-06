import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createBrowserSupabaseClient(url: string, anonKey: string) {
  return createBrowserClient<Database>(url, anonKey);
}
