import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import { RESIDENT_STATUS_LABEL } from "@my-project/shared";

export default async function ResidentsPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice />;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("unit_residents")
    .select(
      `
      id,
      status,
      move_in_date,
      profiles ( full_name, phone ),
      units (
        unit_number,
        buildings ( name, city )
      )
    `
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">דיירים</h1>
        <p className="text-sm text-muted-foreground">
          שיוכי דירה לפי{" "}
          <code className="rounded bg-muted px-1 text-xs">unit_residents</code>{" "}
          ופרופילים.
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
            <CardTitle>אין דיירים</CardTitle>
            <CardDescription>
              לא נמצאו שיוכים פעילים או לשעבר לארגון זה.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">שם</th>
                <th className="px-3 py-2 text-start font-medium">טלפון</th>
                <th className="px-3 py-2 text-start font-medium">בניין</th>
                <th className="px-3 py-2 text-start font-medium">דירה</th>
                <th className="px-3 py-2 text-start font-medium">סטטוס דייר</th>
                <th className="px-3 py-2 text-start font-medium">כניסה</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const profile = row.profiles as unknown as {
                  full_name: string;
                  phone: string | null;
                } | null;
                const unit = row.units as unknown as {
                  unit_number: string;
                  buildings: { name: string; city: string } | null;
                } | null;
                const building = unit?.buildings;
                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      {profile?.full_name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {profile?.phone ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {building ? `${building.name}, ${building.city}` : "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {unit?.unit_number ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.status
                        ? RESIDENT_STATUS_LABEL[row.status]
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.move_in_date
                        ? new Date(row.move_in_date).toLocaleDateString("he-IL")
                        : "—"}
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
