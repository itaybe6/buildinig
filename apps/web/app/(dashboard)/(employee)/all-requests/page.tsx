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
  const { data: rows, error } = await supabase
    .from("service_requests")
    .select("id, title, status, category, buildings!inner(address)")
    .eq("buildings.business_profile_id", ctx.businessProfileId)
    .order("created_at", { ascending: false })
    .limit(120);

  const list = rows ?? [];

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
      ) : list.length === 0 ? (
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
              {list.map((row) => {
                const building = row.buildings as unknown as {
                  address: string;
                } | null;
                return (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{row.title}</td>
                  <td className="px-3 py-2">
                    {building?.address ?? "—"}
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
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
