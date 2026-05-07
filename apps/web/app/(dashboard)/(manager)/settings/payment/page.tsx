import { ManagerPaymentSettingsForm } from "@/components/manager/manager-payment-settings-form";
import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";

export default async function ManagerPaymentSettingsPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  if (ctx.profile.role !== "manager") {
    return (
      <div className="space-y-6" dir="rtl">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>אין הרשאה</CardTitle>
            <CardDescription>
              דף זה זמין למנהלי ועד בית בלבד.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const supabase = createClient();
  const { data: buildings, error } = await supabase
    .from("buildings")
    .select("id, address, city")
    .eq("business_profile_id", ctx.businessProfileId)
    .order("address");

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          הגדרות תשלום
        </h1>
        <p className="text-sm text-muted-foreground">
          הגדרות גביה, תזכורות והתראות — לפי בניין.
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
              הוסיפו בניין לארגון כדי להגדיר תשלומים.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ManagerPaymentSettingsForm
          buildings={buildings.map((b) => ({
            id: b.id,
            label: `${b.address}, ${b.city}`,
          }))}
        />
      )}
    </div>
  );
}
