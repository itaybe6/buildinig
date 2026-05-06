import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getResidentTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";

export default async function ResidentAnnouncementsPage() {
  const ctx = await getResidentTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: items, error } = await supabase
    .from("announcements")
    .select("id, title, body, created_at")
    .eq("business_profile_id", ctx.businessProfileId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">מודעות</h1>
        <p className="text-sm text-muted-foreground">
          עדכונים מהארגון שלך.
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>שגיאת טעינה</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : !items?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>אין מודעות</CardTitle>
            <CardDescription>לא פורסמו מודעות עדיין.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="text-lg">{a.title}</CardTitle>
                <CardDescription>
                  {a.created_at
                    ? new Date(a.created_at).toLocaleString("he-IL")
                    : ""}
                </CardDescription>
              </CardHeader>
              {a.body ? (
                <p className="px-6 pb-6 text-sm whitespace-pre-wrap text-muted-foreground">
                  {a.body}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
