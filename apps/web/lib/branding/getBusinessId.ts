// apps/web/lib/branding/getBusinessId.ts

/**
 * Returns the active tenant id (BUSINESS_ID).
 * Works in both server and client components. On the client side, only the
 * NEXT_PUBLIC_BUSINESS_ID is visible (set in branding/<Client>/.env and inlined by Next).
 *
 * Throws if missing — every tenant-scoped query must have one.
 */
export function getBusinessId(): string {
  const id =
    (typeof process !== "undefined" &&
      (process.env.BUSINESS_ID || process.env.NEXT_PUBLIC_BUSINESS_ID)) ||
    "";
  if (!id) {
    throw new Error(
      "[white-label] BUSINESS_ID is not set. Add it to branding/<Client>/.env " +
        "(BUSINESS_ID and NEXT_PUBLIC_BUSINESS_ID)."
    );
  }
  return id;
}

export function tryGetBusinessId(): string | null {
  try {
    return getBusinessId();
  } catch {
    return null;
  }
}
