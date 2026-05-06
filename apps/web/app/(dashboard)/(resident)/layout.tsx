import { requireAuthProfile } from "@/lib/dashboard/session";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/** קבוצת נתיבים לממשק תושב — מקביל ל־(resident) במובייל */
export default async function ResidentRouteGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAuthProfile();
  if (profile.role !== "resident") {
    redirect("/dashboard");
  }
  return children;
}
