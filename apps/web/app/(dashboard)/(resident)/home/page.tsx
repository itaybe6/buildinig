import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getResidentTenantContext } from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import { REQUEST_STATUS_LABEL } from "@my-project/shared";
import Link from "next/link";

export default async function ResidentHomePage() {
  const ctx = await getResidentTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const profileId = ctx.profile.profileId;
  const { businessProfileId } = ctx;

  const [pinnedRes, openReqsRes] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title")
      .eq("business_profile_id", businessProfileId)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("service_requests")
      .select("id, title, status")
      .eq("business_profile_id", businessProfileId)
      .eq("reported_by", profileId)
      .in("status", ["open", "assigned", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const pinned = pinnedRes.data ?? [];
  const openReqs = openReqsRes.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">בית</h1>
        <p className="text-sm text-muted-foreground">
          סיכום מהיר — מודעות נעוצות וקריאות פתוחות.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>מודעות נעוצות</CardTitle>
          <CardDescription>עדכונים חשובים מהארגון</CardDescription>
        </CardHeader>
        {pinned.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            אין מודעות נעוצות.
          </p>
        ) : (
          <ul className="space-y-2 px-6 pb-6">
            {pinned.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border bg-muted/40 px-3 py-2 text-sm"
              >
                {a.title}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>קריאות פתוחות</CardTitle>
          <CardDescription>
            <Link
              href="/requests"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              כל הקריאות שלי
            </Link>
          </CardDescription>
        </CardHeader>
        {openReqs.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            אין קריאות פתוחות.
          </p>
        ) : (
          <ul className="space-y-2 px-6 pb-6">
            {openReqs.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/requests/${r.id}`}
                  className="flex flex-col rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{r.title}</span>
                  <span className="text-muted-foreground">
                    {REQUEST_STATUS_LABEL[
                      r.status as keyof typeof REQUEST_STATUS_LABEL
                    ] ?? r.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
