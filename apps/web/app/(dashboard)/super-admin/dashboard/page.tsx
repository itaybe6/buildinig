import { requireSuperAdmin } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import Link from "next/link";

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin();
  const supabase = createClient();

  const [tenants, managers, buildings, requests] = await Promise.all([
    supabase.from("tenants").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "manager"),
    supabase.from("buildings").select("id", { count: "exact", head: true }),
    supabase.from("service_requests").select("id", { count: "exact", head: true }),
  ]);

  const tiles = [
    {
      label: "חברות ניהול (לקוחות)",
      value: tenants.count ?? 0,
      href: "/super-admin/tenants",
      hint: "כל ארגוני הניהול",
    },
    {
      label: "מנהלי לקוח",
      value: managers.count ?? 0,
      href: "/super-admin/tenants",
      hint: "משתמשים מסוג מנהל",
    },
    {
      label: "בניינים",
      value: buildings.count ?? 0,
      href: "/super-admin/tenants",
      hint: "ניהול לפי לקוח",
    },
    {
      label: "קריאות שירות",
      value: requests.count ?? 0,
      href: null,
      hint: "בכל המערכת",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">סקירת עסק</h1>
        <p className="text-sm text-muted-foreground">
          תמונה ברמת הפלטפורמה — כל הלקוחות, המנהלים והנכסים.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) =>
          t.href ? (
            <Link key={t.label} href={t.href}>
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">{t.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{t.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card key={t.label} className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{t.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
