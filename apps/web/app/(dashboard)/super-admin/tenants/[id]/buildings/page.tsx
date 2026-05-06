import { SuperAdminAddBuildingForm } from "@/components/super-admin/add-building-form";
import { requireSuperAdmin } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import type { Database } from "@my-project/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

type BuildingRow = Pick<
  Database["public"]["Tables"]["buildings"]["Row"],
  "id" | "name" | "address" | "city" | "floors_count" | "is_active"
>;

export default async function TenantBuildingsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireSuperAdmin();
  const supabase = createClient();

  const { data: tenant, error: te } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("id", params.id)
    .maybeSingle();

  if (te) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>שגיאה</CardTitle>
          <CardDescription>{te.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!tenant) notFound();

  const tenantInfo = tenant as { id: string; name: string };

  const showNewTenantHint =
    searchParams.new_tenant === "1" || searchParams.new_tenant === "true";

  const { data: buildings, error } = await supabase
    .from("buildings")
    .select("id, name, address, city, floors_count, is_active, created_at")
    .eq("tenant_id", params.id)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            בניינים — {tenantInfo.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            מסונן לפי tenant_id — עסק: {tenantInfo.name}
          </p>
        </div>
        <Link
          href="/super-admin/tenants"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          חזרה ללקוחות
        </Link>
      </div>

      {showNewTenantHint ? (
        <Card className="border-primary/25 bg-primary/[0.06] shadow-none">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base text-foreground">
              העסק נוצר בהצלחה
            </CardTitle>
            <CardDescription className="text-foreground/80">
              כעת הוסיפו בניין אחד או יותר — כל בניין משויך אוטומטית ללקוח{" "}
              <span className="font-medium">{tenantInfo.name}</span>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <SuperAdminAddBuildingForm tenantId={params.id} />

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : !buildings?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>אין בניינים</CardTitle>
            <CardDescription>לא נמצאו בניינים לחברה זו.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">שם</th>
                <th className="px-3 py-2 text-start font-medium">כתובת</th>
                <th className="px-3 py-2 text-start font-medium">עיר</th>
                <th className="px-3 py-2 text-start font-medium">קומות</th>
                <th className="px-3 py-2 text-start font-medium">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {(buildings as BuildingRow[]).map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{b.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{b.address}</td>
                  <td className="px-3 py-2">{b.city}</td>
                  <td className="px-3 py-2 tabular-nums">{b.floors_count}</td>
                  <td className="px-3 py-2">{b.is_active ? "פעיל" : "לא פעיל"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
