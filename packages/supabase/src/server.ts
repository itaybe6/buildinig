import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "./database.types";

export type CookieStoreAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: { name: string; value: string; options: CookieOptions }[]
  ) => void;
};

export function createServerSupabaseClient(
  url: string,
  anonKey: string,
  cookieStore: CookieStoreAdapter
) {
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (
        cookies: { name: string; value: string; options: CookieOptions }[]
      ) => cookieStore.setAll(cookies),
    },
  });
}
