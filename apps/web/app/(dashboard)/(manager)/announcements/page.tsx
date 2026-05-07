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
import { ANNOUNCEMENT_AUDIENCE_LABEL } from "@my-project/shared";

export default async function AnnouncementsPage() {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("announcements")
    .select(
      `
      id,
      title,
      body,
      audience,
      is_pinned,
      expires_at,
      created_at,
      buildings!inner ( address, city )
    `
    )
    .eq("buildings.business_profile_id", ctx.businessProfileId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">לוח מודעות</h1>
        <p className="text-sm text-muted-foreground">טבלת announcements לפי ארגון.</p>
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
            <CardTitle>אין מודעות</CardTitle>
            <CardDescription>לא נמצאו רשומות.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const b = row.buildings as unknown as {
              address: string;
              city: string;
            } | null;
            return (
              <Card key={row.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-lg">{row.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {row.is_pinned ? (
                        <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">
                          נעוץ
                        </span>
                      ) : null}
                      <span>
                        {ANNOUNCEMENT_AUDIENCE_LABEL[row.audience ?? "all"]}
                      </span>
                      <span>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString("he-IL")
                          : ""}
                      </span>
                    </div>
                  </div>
                  <CardDescription>
                    {b ? `${b.address}, ${b.city}` : "בניין"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {row.body}
                  </p>
                  {row.expires_at ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      תפוגה:{" "}
                      {new Date(row.expires_at).toLocaleString("he-IL")}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
