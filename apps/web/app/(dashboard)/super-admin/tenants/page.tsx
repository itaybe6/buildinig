import { SuperAdminTenantTableRow } from "@/components/super-admin/super-admin-tenant-table-row";
import { Button } from "@/components/ui/button";
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

type BusinessProfileRow =
  Database["public"]["Tables"]["business_profiles"]["Row"];
type ManagerPick = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "tenant_id" | "full_name"
>;
type OrphanManager = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "phone" | "mobile_phone" | "created_at"
>;

export default async function SuperAdminTenantsPage() {
  await requireSuperAdmin();
  const supabase = createClient();

  const { data: tenantsRaw, error } = await supabase
    .from("business_profiles")
    .select(
      "id, name, contact_email, plan, is_active, created_at, legal_name, tax_id"
    )
    .order("created_at", { ascending: false });

  const { data: managersRaw } = await supabase
    .from("profiles")
    .select("tenant_id, full_name")
    .eq("role", "manager")
    .not("tenant_id", "is", null);

  const { data: orphanManagersRaw } = await supabase
    .from("profiles")
    .select("id, full_name, phone, mobile_phone, created_at")
    .eq("role", "manager")
    .is("tenant_id", null)
    .order("created_at", { ascending: false });

  const tenants = (tenantsRaw ?? []) as BusinessProfileRow[];
  const managersList = (managersRaw ?? []) as ManagerPick[];
  const orphanManagers = (orphanManagersRaw ?? []) as OrphanManager[];

  const managersByTenant = new Map<string, string[]>();
  for (const m of managersList) {
    if (!m.tenant_id) continue;
    const list = managersByTenant.get(m.tenant_id) ?? [];
    list.push(m.full_name);
    managersByTenant.set(m.tenant_id, list);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            לקוחות (מנהלים)
          </h1>
          <p className="text-sm text-muted-foreground">
            כל עסק הוא רשומת{" "}
            <code className="rounded bg-muted px-1 text-xs">
              business_profiles
            </code>
            . מנהל משויך דרך{" "}
            <code className="rounded bg-muted px-1 text-xs">profiles.tenant_id</code>{" "}
            לאותו מזהה.
          </p>
        </div>
        <Button asChild className="h-11 w-full shrink-0 sm:h-10 sm:w-auto">
          <Link href="/super-admin/tenants/new">הוספת לקוח חדש</Link>
        </Button>
      </div>

      {orphanManagers.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="text-lg text-amber-950">
              מנהלים ללא עסק משויך
            </CardTitle>
            <CardDescription className="text-amber-900">
              משתמשים עם role מנהל אבל ללא{" "}
              <code className="rounded bg-white/80 px-1">tenant_id</code> — לא
              יופיעו תחת לקוח עד שתשייכו אותם לעסק.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-amber-200 bg-white">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="border-b bg-amber-100/80">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">שם</th>
                    <th className="px-3 py-2 text-start font-medium">טלפון</th>
                    <th className="px-3 py-2 text-start font-medium">פלאפון</th>
                    <th className="px-3 py-2 text-start font-medium">נוצר</th>
                  </tr>
                </thead>
                <tbody>
                  {orphanManagers.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{o.full_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {o.phone ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {o.mobile_phone ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {o.created_at
                          ? new Date(o.created_at).toLocaleDateString("he-IL")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

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
            <CardTitle>אין חברות בטבלה</CardTitle>
            <CardDescription>
              עדיין לא נוצרו עסקים — השתמשו בכפתור &quot;הוספת לקוח חדש&quot;
              למעלה.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">שם</th>
                <th className="px-3 py-2 text-start font-medium">שם משפטי</th>
                <th className="px-3 py-2 text-start font-medium">מנהלים</th>
                <th className="px-3 py-2 text-start font-medium">אימייל</th>
                <th className="px-3 py-2 text-start font-medium">תוכנית</th>
                <th className="px-3 py-2 text-start font-medium">פעיל</th>
                <th className="px-3 py-2 text-start font-medium">נוצר</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const mgrs = managersByTenant.get(t.id) ?? [];
                return (
                  <SuperAdminTenantTableRow key={t.id} tenantId={t.id}>
                    <td className="px-3 py-2 font-medium text-primary">
                      {t.name}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {t.legal_name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {mgrs.length ? mgrs.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2">{t.contact_email ?? "—"}</td>
                    <td className="px-3 py-2">{t.plan ?? "—"}</td>
                    <td className="px-3 py-2">{t.is_active ? "כן" : "לא"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {t.created_at
                        ? new Date(t.created_at).toLocaleDateString("he-IL")
                        : "—"}
                    </td>
                  </SuperAdminTenantTableRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
