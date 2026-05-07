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
import Link from "next/link";

export default async function EmployeeAssignmentsPage() {
  const ctx = await getEmployeeTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("service_requests")
    .select("id, title, status, category, created_at, buildings!inner(business_profile_id)")
    .eq("buildings.business_profile_id", ctx.businessProfileId)
    .eq("assigned_to", ctx.profile.profileId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">המשימות שלי</h1>
        <p className="text-sm text-muted-foreground">
          קריאות שירות שהוקצו אליך.
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : !rows?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>אין משימות</CardTitle>
            <CardDescription>לא נמצאו קריאות משויכות אליך.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">נושא</th>
                <th className="px-3 py-2 text-start font-medium">קטגוריה</th>
                <th className="px-3 py-2 text-start font-medium">סטטוס</th>
                <th className="px-3 py-2 text-start font-medium">נוצר</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/assignments/${row.id}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {row.title}
                    </Link>
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
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString("he-IL")
                      : "—"}
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
