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
import { REQUEST_CATEGORY_LABEL } from "@my-project/shared";

export default async function ServiceTypesPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice />;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("service_types")
    .select(
      "id, name, description, category, price_min, price_max, price_unit, is_active, created_at"
    )
    .eq("tenant_id", ctx.tenantId)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">סוגי שירות</h1>
        <p className="text-sm text-muted-foreground">טבלת service_types.</p>
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
            <CardTitle>אין סוגי שירות</CardTitle>
            <CardDescription>הוסיפו רשומות ב-Supabase או דרך הממשק בעתיד.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">שם</th>
                <th className="px-3 py-2 text-start font-medium">קטגוריה</th>
                <th className="px-3 py-2 text-start font-medium">תיאור</th>
                <th className="px-3 py-2 text-start font-medium">מחיר מינ׳</th>
                <th className="px-3 py-2 text-start font-medium">מחיר מקס׳</th>
                <th className="px-3 py-2 text-start font-medium">יחידה</th>
                <th className="px-3 py-2 text-start font-medium">פעיל</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">
                    {REQUEST_CATEGORY_LABEL[r.category]}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-muted-foreground">
                    {r.description ?? "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {r.price_min ?? "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {r.price_max ?? "—"}
                  </td>
                  <td className="px-3 py-2">{r.price_unit ?? "—"}</td>
                  <td className="px-3 py-2">{r.is_active ? "כן" : "לא"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
