import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import Link from "next/link";

export function NoTenantNotice() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>לא נבחר ארגון</CardTitle>
        <CardDescription>
          חסר מזהה ארגון בפרופיל או בקובץ הסביבה (BUSINESS_ID).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          נא לשייך משתמש לארגון ב-Supabase או להגדיר{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            BUSINESS_ID / NEXT_PUBLIC_BUSINESS_ID
          </code>{" "}
          עבור התקנה לבן-שיח יחיד.
        </p>
        <Link
          href="/super-admin/tenants"
          className="inline-block font-medium text-primary underline-offset-4 hover:underline"
        >
          מעבר לחברות ניהול
        </Link>
      </CardContent>
    </Card>
  );
}
