import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-project/ui-web";
import Link from "next/link";

export type NoTenantReason = "no_tenant" | "no_business_profile";

export function NoTenantNotice({
  reason = "no_tenant",
}: {
  reason?: NoTenantReason;
}) {
  const noBusiness =
    reason === "no_business_profile";

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>
          {noBusiness ? "חסר פרופיל עסק" : "לא נבחר ארגון"}
        </CardTitle>
        <CardDescription>
          {noBusiness
            ? "לא נמצא רשומת business_profiles המקושרת לארגון שלך. צור עסק או סנכרן נתונים."
            : "חסר מזהה ארגון בפרופיל או בקובץ הסביבה (BUSINESS_ID)."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          {noBusiness ? (
            <>
              ודא שקיימת רשומה בטבלת{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                business_profiles
              </code>{" "}
              עם אותו{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                tenant_id
              </code>{" "}
              כמו בארגון שלך.
            </>
          ) : (
            <>
              נא לשייך משתמש לארגון ב-Supabase או להגדיר{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                BUSINESS_ID / NEXT_PUBLIC_BUSINESS_ID
              </code>{" "}
              עבור התקנה לבן-שיח יחיד.
            </>
          )}
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
