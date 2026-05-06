import { Redirect, useLocalSearchParams } from "expo-router";

/** תאימות לאחור — הקישור הישן מפנה לעמוד הבקרה המלא של העסק */
export default function LegacyTenantBuildingsRedirect() {
  const { id, new_tenant: newTenant } = useLocalSearchParams<{
    id: string;
    new_tenant?: string;
  }>();
  const tenantId = Array.isArray(id) ? id[0] : id;
  const nt = Array.isArray(newTenant) ? newTenant[0] : newTenant;
  const q =
    nt === "1" || nt === "true" ? "?new_tenant=1" : "";
  if (!tenantId) {
    return null;
  }
  return <Redirect href={`/(super-admin)/tenants/${tenantId}${q}`} />;
}
