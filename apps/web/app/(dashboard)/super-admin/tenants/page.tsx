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

type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];
type ManagerPick = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "tenant_id" | "full_name"
>;

export default async function SuperAdminTenantsPage() {
  await requireSuperAdmin();
  const supabase = createClient();

  const { data: tenantsRaw, error } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, contact_email, plan, is_active, commission_rate, created_at"
    )
    .order("created_at", { ascending: false });

  const { data: managersRaw } = await supabase
    .from("profiles")
    .select("tenant_id, full_name")
    .eq("role", "manager")
    .not("tenant_id", "is", null);

  const tenants = (tenantsRaw ?? []) as TenantRow[];
  const managersList = (managersRaw ?? []) as ManagerPick[];

  const managersByTenant = new Map<string, string[]>();
  for (const m of managersList) {
    if (!m.tenant_id) continue;
    const list = managersByTenant.get(m.tenant_id) ?? [];
    list.push(m.full_name);
    managersByTenant.set(m.tenant_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          לקוחות (מנהלים)
        </h1>
        <p className="text-sm text-muted-foreground">
          חברות ניהול במערכת ומנהלי מפתח לכל ארגון. ניהול בניינים לפי לקוח.
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : !tenants.length ? (
        <Card>
          <CardHeader>
            <CardTitle>אין חברות</CardTitle>
            <CardDescription>לא נמצאו רשומות tenants.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">שם</th>
                <th className="px-3 py-2 text-start font-medium">מנהלים</th>
                <th className="px-3 py-2 text-start font-medium">slug</th>
                <th className="px-3 py-2 text-start font-medium">אימייל</th>
                <th className="px-3 py-2 text-start font-medium">תוכנית</th>
                <th className="px-3 py-2 text-start font-medium">עמלה</th>
                <th className="px-3 py-2 text-start font-medium">פעיל</th>
                <th className="px-3 py-2 text-start font-medium">נוצר</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const mgrs = managersByTenant.get(t.id) ?? [];
                return (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/super-admin/tenants/${t.id}/buildings`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {mgrs.length ? mgrs.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{t.slug}</td>
                    <td className="px-3 py-2">{t.contact_email ?? "—"}</td>
                    <td className="px-3 py-2">{t.plan ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {t.commission_rate ?? "—"}
                    </td>
                    <td className="px-3 py-2">{t.is_active ? "כן" : "לא"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {t.created_at
                        ? new Date(t.created_at).toLocaleDateString("he-IL")
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
