import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getEmployeeTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import {
  REQUEST_CATEGORY_LABEL,
  REQUEST_STATUS_LABEL,
} from "@my-project/shared";

export default async function EmployeeAllRequestsPage() {
  const ctx = await getEmployeeTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: rawRows, error } = await supabase
    .from("service_requests")
    .select("id, title, status, category, building_id")
    .eq("business_profile_id", ctx.businessProfileId)
    .order("created_at", { ascending: false })
    .limit(120);

  const rows = rawRows ?? [];
  const buildingIds = Array.from(new Set(rows.map((r) => r.building_id)));

  const { data: buildingRows } =
    buildingIds.length > 0
      ? await supabase
          .from("buildings")
          .select("id, address")
          .in("id", buildingIds)
      : { data: [] };

  const addressByBuildingId = Object.fromEntries(
    (buildingRows ?? []).map((b) => [b.id, b.address])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">כל הקריאות</h1>
        <p className="text-sm text-muted-foreground">
          כל קריאות השירות בארגון.
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>אין קריאות</CardTitle>
            <CardDescription>לא נמצאו רשומות.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">נושא</th>
                <th className="px-3 py-2 text-start font-medium">בניין</th>
                <th className="px-3 py-2 text-start font-medium">קטגוריה</th>
                <th className="px-3 py-2 text-start font-medium">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{row.title}</td>
                  <td className="px-3 py-2">
                    {addressByBuildingId[row.building_id] ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {REQUEST_CATEGORY_LABEL[
                      row.category as keyof typeof REQUEST_CATEGORY_LABEL
                    ] ?? row.category}
                  </td>
                  <td className="px-3 py-2">
                    {REQUEST_STATUS_LABEL[
                      row.status as keyof typeof REQUEST_STATUS_LABEL
                    ] ?? row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
