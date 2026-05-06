import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getResidentTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_TYPE_LABEL,
} from "@my-project/shared";

export default async function ResidentPaymentsPage() {
  const ctx = await getResidentTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("payments")
    .select("id, amount, currency, status, type, due_date")
    .eq("business_profile_id", ctx.businessProfileId)
    .eq("resident_id", ctx.profile.profileId)
    .order("due_date", { ascending: false })
    .limit(80);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">תשלומים</h1>
        <p className="text-sm text-muted-foreground">
          תשלומים המשויכים אליך בארגון.
        </p>
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
            <CardTitle>אין תשלומים</CardTitle>
            <CardDescription>לא נמצאו רשומות תשלום.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-start font-medium">סכום</th>
                <th className="px-3 py-2 text-start font-medium">סוג</th>
                <th className="px-3 py-2 text-start font-medium">סטטוס</th>
                <th className="px-3 py-2 text-start font-medium">תאריך יעד</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2 tabular-nums">
                    {row.amount}{" "}
                    <span className="text-muted-foreground">
                      {row.currency ?? "ILS"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {PAYMENT_TYPE_LABEL[
                      row.type as keyof typeof PAYMENT_TYPE_LABEL
                    ] ?? row.type}
                  </td>
                  <td className="px-3 py-2">
                    {PAYMENT_STATUS_LABEL[
                      row.status as keyof typeof PAYMENT_STATUS_LABEL
                    ] ?? row.status}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.due_date
                      ? new Date(row.due_date).toLocaleDateString("he-IL")
                      : "—"}
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
