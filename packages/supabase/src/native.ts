import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createNativeSupabaseClient(
  url: string,
  anonKey: string,
  storage: {
    getItem: (key: string) => Promise<string | null> | string | null;
    setItem: (key: string, value: string) => Promise<void> | void;
    removeItem: (key: string) => Promise<void> | void;
  }
) {
  return createClient<Database>(url, anonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
