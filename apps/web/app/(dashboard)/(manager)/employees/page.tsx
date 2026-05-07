import { AddEmployeeDialog } from "@/components/manager/add-employee-dialog";
import { EmployeesTable } from "@/components/manager/employees-table";
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
    .in("role", ["cleaner", "gardener", "employee"])
    .order("full_name");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">עובדים</h1>
          <p className="text-sm text-muted-foreground">
            מנקים, גננים ותפקידי שטח נוספים בארגון.
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
            <CardDescription>לא נמצאו עובדי שטח (מנקה / גנן).</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <EmployeesTable
          rows={rows}
          canManage={ctx.profile.role === "manager"}
        />
      )}
    </div>
  );
}
