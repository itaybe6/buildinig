import { NoTenantNotice } from "@/components/no-tenant-notice";
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
  if (!ctx.ok) return <NoTenantNotice />;

  const supabase = createClient();
  const { data: buildings, error } = await supabase
    .from("buildings")
    .select("id, name, address, city, floors_count, is_active, created_at")
    .eq("tenant_id", ctx.tenantId)
    .order("name");

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
              {buildings.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/buildings/${b.id}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {b.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{b.address}</td>
                  <td className="px-3 py-2">{b.city}</td>
                  <td className="px-3 py-2 tabular-nums">{b.floors_count}</td>
                  <td className="px-3 py-2">
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
