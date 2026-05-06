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

export default async function TenantSettingsPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice />;

  const supabase = createClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, logo_url, primary_color, contact_email, contact_phone, plan, commission_rate, is_active, created_at"
    )
    .eq("id", ctx.tenantId)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">הגדרות ארגון</h1>
        <p className="text-sm text-muted-foreground">
          נתונים מטבלת tenants (קריאה בלבד בשלב זה).
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : !tenant ? (
        <Card>
          <CardHeader>
            <CardTitle>לא נמצא ארגון</CardTitle>
            <CardDescription>בדקו שמזהה tenant תואם לרשומה ב-Supabase.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{tenant.name}</CardTitle>
            <CardDescription>slug: {tenant.slug}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">אימייל יצירת קשר</p>
              <p>{tenant.contact_email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">טלפון</p>
              <p>{tenant.contact_phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">תוכנית</p>
              <p>{tenant.plan ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">עמלת מערכת</p>
              <p>{tenant.commission_rate ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">צבע ראשי</p>
              <p className="font-mono">{tenant.primary_color ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">פעיל</p>
              <p>{tenant.is_active ? "כן" : "לא"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">לוגו</p>
              <p className="break-all">{tenant.logo_url ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">נוצר</p>
              <p>
                {tenant.created_at
                  ? new Date(tenant.created_at).toLocaleString("he-IL")
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
