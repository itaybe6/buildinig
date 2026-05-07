// packages/shared/src/tenant/index.ts
//
// White-label multi-tenant helpers.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@my-project/supabase";

// Tenant scope uses `business_profile_id` (= FK → business_profiles.id).
//
// USAGE PATTERN (must apply in every query):
//   import { withTenant } from "@my-project/shared";
//   const rows = await withTenant(supabase.from("units").select("*"), tenantId);
//
// For inserts:
//   import { insertWithTenant } from "@my-project/shared";
//   await insertWithTenant(supabase.from("buildings"), tenantId, { address: "...", city: "..." });
//
// `business_profiles` rows use `id` as the tenant identifier — filter by `id`
// when querying the current org row; do not pass that query through `withTenant`.

export const TENANT_COLUMN = "business_profile_id" as const;

type Filterable<T> = {
  eq: (column: string, value: string) => T;
};

type Insertable<T> = {
  insert: (values: Record<string, unknown> | Record<string, unknown>[]) => T;
};

export function withTenant<T extends Filterable<T>>(query: T, tenantId: string): T {
  if (!tenantId) {
    throw new Error("[white-label] withTenant: tenantId is required");
  }
  return query.eq(TENANT_COLUMN, tenantId);
}

export function insertWithTenant<T>(
  table: Insertable<T>,
  tenantId: string,
  values: Record<string, unknown> | Record<string, unknown>[]
): T {
  if (!tenantId) {
    throw new Error("[white-label] insertWithTenant: tenantId is required");
  }
  const decorate = (row: Record<string, unknown>) => ({
    ...row,
    [TENANT_COLUMN]: tenantId,
  });
  if (Array.isArray(values)) {
    return table.insert(values.map(decorate));
  }
  return table.insert(decorate(values));
}

/**
 * Returns the column name to filter on for a given table.
 * `business_profiles` is special-cased — its primary key IS the tenant id.
 */
export function tenantFilterColumn(table: string): string {
  if (table === "business_profiles") return "id";
  return "business_profile_id";
}

/**
 * Tenant id carried on the Supabase session JWT (`user.app_metadata`), synced from
 * `profiles.business_profile_id` via DB trigger. Optional legacy key `BUSINESS_ID`.
 */
export function businessProfileIdFromJwtAppMetadata(
  appMetadata: Record<string, unknown> | undefined | null
): string | null {
  if (!appMetadata) return null;
  const v = appMetadata.business_profile_id ?? appMetadata.BUSINESS_ID;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** When `profiles.business_profile_id` is null, derive tenant from a unit that lists this profile as resident. */
export async function inferBusinessProfileIdFromProfileLinks(
  client: SupabaseClient<Database>,
  row: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "business_profile_id">
): Promise<string | null> {
  if (row.business_profile_id) {
    return row.business_profile_id;
  }
  const { data: unitRow } = await client
    .from("units")
    .select("building_id")
    .eq("resident_profile_id", row.id)
    .maybeSingle();
  if (!unitRow?.building_id) {
    return null;
  }
  const { data: bRow } = await client
    .from("buildings")
    .select("business_profile_id")
    .eq("id", unitRow.building_id)
    .maybeSingle();
  return bRow?.business_profile_id ?? null;
}
