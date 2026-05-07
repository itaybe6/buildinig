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
import {
  REQUEST_CATEGORY_LABEL,
  REQUEST_PRIORITY_LABEL,
  REQUEST_STATUS_LABEL,
} from "@my-project/shared";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ServiceRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: req, error } = await supabase
    .from("service_requests")
    .select(
      `
      *,
      buildings!inner ( address, city ),
      units ( unit_number ),
      reporter:profiles!service_requests_reported_by_fkey ( full_name, phone ),
      assignee:profiles!service_requests_assigned_to_fkey ( full_name, phone )
    `
    )
    .eq("id", params.id)
    .eq("buildings.business_profile_id", ctx.businessProfileId)
    .maybeSingle();

  if (error) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>שגיאה</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!req) notFound();

  const { data: comments } = await supabase
    .from("service_request_comments")
    .select(
      `
      id,
      body,
      created_at,
      author:profiles!service_request_comments_author_id_fkey ( full_name )
    `
    )
    .eq("request_id", params.id)
    .eq("business_profile_id", ctx.businessProfileId)
    .order("created_at", { ascending: true });

  const building = req.buildings as unknown as {
    address: string;
    city: string;
  } | null;
  const unit = req.units as unknown as { unit_number: string } | null;
  const reporter = req.reporter as unknown as {
    full_name: string;
    phone: string | null;
  } | null;
  const assignee = req.assignee as unknown as {
    full_name: string;
    phone: string | null;
  } | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{req.title}</h1>
          <p className="text-sm text-muted-foreground">
            {REQUEST_CATEGORY_LABEL[req.category]} ·{" "}
            {REQUEST_PRIORITY_LABEL[req.priority]} ·{" "}
            {REQUEST_STATUS_LABEL[req.status]}
          </p>
        </div>
        <Link
          href="/service-requests"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          חזרה ללוח
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מיקום</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">בניין: </span>
              {building ? `${building.address}, ${building.city}` : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">דירה: </span>
              {unit?.unit_number ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">אנשים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">מדווח: </span>
              {reporter?.full_name ?? "—"} {reporter?.phone ? `(${reporter.phone})` : ""}
            </p>
            <p>
              <span className="text-muted-foreground">הוקצה ל: </span>
              {assignee?.full_name ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {req.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תיאור</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{req.description}</p>
          </CardContent>
        </Card>
      ) : null}

      {req.internal_notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">הערות פנימיות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{req.internal_notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="mb-3 text-lg font-medium">תגובות</h2>
        {!comments?.length ? (
          <p className="text-sm text-muted-foreground">אין תגובות עדיין.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => {
              const a = c.author as unknown as { full_name: string } | null;
              return (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardDescription>
                      {a?.full_name ?? "משתמש"} ·{" "}
                      {c.created_at
                        ? new Date(c.created_at).toLocaleString("he-IL")
                        : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
