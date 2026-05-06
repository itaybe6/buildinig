import { NoTenantNotice } from "@/components/no-tenant-notice";
import { countUnitsByBuildingId } from "@/lib/building-unit-helpers";
import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import Link from "next/link";

export default async function BuildingsPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: buildings, error } = await supabase
    .from("buildings")
    .select("id, address, city, floors_count, is_active, created_at")
    .eq("business_profile_id", ctx.businessProfileId)
    .order("address");

  const buildingIds = buildings?.map((b) => b.id) ?? [];
  const { data: unitRows, error: unitsError } =
    buildingIds.length > 0
      ? await supabase
          .from("units")
          .select("building_id")
          .in("building_id", buildingIds)
      : { data: [] as { building_id: string }[], error: null };

  const unitCountByBuilding = countUnitsByBuildingId(unitRows ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">בניינים</h1>
        <p className="text-sm text-muted-foreground">
          רשימת בניינים לפי טבלת{" "}
          <code className="rounded bg-muted px-1 text-xs">buildings</code>.
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : unitsError ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינת דירות</CardTitle>
            <CardDescription>{unitsError.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : !buildings?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>אין בניינים</CardTitle>
            <CardDescription>
              עדיין לא נוספו רשומות — הוסיפו בניין ב-Supabase או דרך ממשק הוספה
              כשיהיה זמין.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">כתובת</th>
                <th className="px-3 py-2 text-start font-medium">עיר</th>
                <th className="px-3 py-2 text-start font-medium">קומות</th>
                <th className="px-3 py-2 text-start font-medium">דירות</th>
                <th className="px-3 py-2 text-start font-medium">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/buildings/${b.id}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {b.address}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{b.city}</td>
                  <td className="px-3 py-2 tabular-nums">{b.floors_count}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {unitCountByBuilding.get(b.id) ?? 0}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {b.is_active ? "פעיל" : "לא פעיל"}
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
