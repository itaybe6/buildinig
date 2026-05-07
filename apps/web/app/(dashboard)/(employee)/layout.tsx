import { requireAuthProfile } from "@/lib/dashboard/session";
import { isFieldWorkerRole } from "@my-project/shared";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/** קבוצת נתיבים לממשק עובד — מקביל ל־(employee) במובייל */
export default async function EmployeeRouteGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAuthProfile();
  if (!isFieldWorkerRole(profile.role)) {
    redirect("/dashboard");
  }
  return children;
}
