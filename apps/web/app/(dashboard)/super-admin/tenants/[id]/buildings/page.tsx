import { SuperAdminAddBuildingForm } from "@/components/super-admin/add-building-form";
import { requireSuperAdmin } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
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
}: {
  params: { id: string };
}) {
  await requireSuperAdmin();
  const supabase = createClient();

  const { data: tenant, error: te } = await supabase
    .from("tenants")
    .select("id, name, slug")
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

  const tenantInfo = tenant as { id: string; name: string; slug: string };

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
            מסונן לפי tenant_id (slug: {tenantInfo.slug})
          </p>
        </div>
        <Link
          href="/super-admin/tenants"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          חזרה ללקוחות
        </Link>
      </div>

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
