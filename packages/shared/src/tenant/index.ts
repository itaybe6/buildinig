// packages/shared/src/tenant/index.ts
//
// White-label multi-tenant helpers.
//
// In this codebase, every tenant-scoped table has a `tenant_id` column
// (the "business_id" referred to in the white-label spec).
//
// USAGE PATTERN (must apply in every query):
//   import { withTenant } from "@my-project/shared";
//   const rows = await withTenant(supabase.from("buildings").select("*"), tenantId);
//
// For inserts:
//   import { insertWithTenant } from "@my-project/shared";
//   await insertWithTenant(supabase.from("buildings"), tenantId, { address: "...", city: "..." });
//
// `business_profiles` rows use `id` as the tenant identifier — filter by `id`
// when querying the current org row; do not pass that query through `withTenant`.

export const TENANT_COLUMN = "tenant_id" as const;

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
  return table === "business_profiles" ? "id" : TENANT_COLUMN;
}
