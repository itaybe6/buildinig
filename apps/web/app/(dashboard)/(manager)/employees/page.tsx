import { AddEmployeeDialog } from "@/components/manager/add-employee-dialog";
import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";

export default async function EmployeesPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, is_active, created_at")
    .eq("business_profile_id", ctx.businessProfileId)
    .eq("role", "employee")
    .order("full_name");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">עובדים</h1>
          <p className="text-sm text-muted-foreground">
            פרופילים עם תפקיד עובד שטח בארגון.
          </p>
        </div>
        {ctx.profile.role === "manager" ? <AddEmployeeDialog /> : null}
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
            <CardTitle>אין עובדים</CardTitle>
            <CardDescription>לא נמצאו משתמשים עם role = employee.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">שם</th>
                <th className="px-3 py-2 text-start font-medium">טלפון</th>
                <th className="px-3 py-2 text-start font-medium">פעיל</th>
                <th className="px-3 py-2 text-start font-medium">נוצר</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{r.full_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.phone ?? "—"}
                  </td>
                  <td className="px-3 py-2">{r.is_active ? "כן" : "לא"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString("he-IL")
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
