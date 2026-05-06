"use client";

import type { Database } from "@my-project/supabase";
import { createBrowserSupabaseClient } from "@my-project/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url || !key) {
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. " +
      "These are loaded from branding/<Client>/.env at server startup, then inlined by Next."
  );
}

export function createClient(): SupabaseClient<Database> {
  return createBrowserSupabaseClient(url, key) as unknown as SupabaseClient<Database>;
}
