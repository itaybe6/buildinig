import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getResidentTenantContext } from "@/lib/dashboard/session";
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

export default async function ResidentRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getResidentTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("service_requests")
    .select(
      "title, description, category, status, priority, created_at, reported_by, image_urls, video_urls, buildings!inner(business_profile_id)"
    )
    .eq("id", id)
    .eq("buildings.business_profile_id", ctx.businessProfileId)
    .maybeSingle();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>שגיאה</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!row) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/requests"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← חזרה לקריאות
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {row.title}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>פרטים</CardTitle>
          <CardDescription>
            נוצר{" "}
            {row.created_at
              ? new Date(row.created_at).toLocaleString("he-IL")
              : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium">סטטוס: </span>
            {REQUEST_STATUS_LABEL[
              row.status as keyof typeof REQUEST_STATUS_LABEL
            ] ?? row.status}
          </p>
          <p>
            <span className="font-medium">קטגוריה: </span>
            {REQUEST_CATEGORY_LABEL[
              row.category as keyof typeof REQUEST_CATEGORY_LABEL
            ] ?? row.category}
          </p>
          <p>
            <span className="font-medium">עדיפות: </span>
            {REQUEST_PRIORITY_LABEL[
              row.priority as keyof typeof REQUEST_PRIORITY_LABEL
            ] ?? row.priority}
          </p>
          <p>
            <span className="font-medium">מגיש: </span>
            {row.reported_by === ctx.profile.profileId ? "את/ה" : "דייר אחר"}
          </p>
          {row.description ? (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {row.description}
            </p>
          ) : null}
          {(row.image_urls?.length ?? 0) > 0 ||
          (row.video_urls?.length ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {(row.image_urls ?? []).map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt=""
                    className="h-36 w-36 rounded-md border object-cover"
                  />
                </a>
              ))}
              {(row.video_urls ?? []).map((url) => (
                <video
                  key={url}
                  src={url}
                  controls
                  className="max-h-60 max-w-full rounded-md border"
                />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
