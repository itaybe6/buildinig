import { AddServiceTypeDialog } from "@/components/manager/add-service-type-dialog";
import type { ServiceTypeTableRow } from "@/components/manager/service-types-table";
import { ServiceTypesTable } from "@/components/manager/service-types-table";
import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";

export default async function ServiceTypesPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("service_types")
    .select(
      "id, name, description, price_min, price_max, is_active, created_at"
    )
    .eq("business_profile_id", ctx.businessProfileId)
    .order("name");

  const canManage = ctx.profile.role === "manager";

  const tableRows: ServiceTypeTableRow[] = (rows ?? []) as ServiceTypeTableRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">סוגי שירות</h1>
          <p className="text-sm text-muted-foreground">
            הגדרת סוגי שירות לארגון — מופיעים בהצעות מחיר ובחירות דיירים לפי
            ההגדרות.
          </p>
        </div>
        {canManage ? <AddServiceTypeDialog /> : null}
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : !tableRows.length ? (
        <Card>
          <CardHeader>
            <CardTitle>אין סוגי שירות</CardTitle>
            <CardDescription>
              {canManage
                ? "לחצו על «הוספת סוג שירות» למעלה כדי ליצור את הרשומה הראשונה."
                : "לא נמצאו סוגי שירות לארגון."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ServiceTypesTable rows={tableRows} canManage={canManage} />
      )}
    </div>
  );
}
