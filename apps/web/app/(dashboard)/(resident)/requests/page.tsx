import { NoTenantNotice } from "@/components/no-tenant-notice";
import { getResidentTenantContext } from "@/lib/dashboard/session";
import { getResidentBuildingOptions } from "@/lib/resident/building-options";
import { createClient } from "@/lib/supabase/server";
import { ResidentHubForms } from "./resident-hub-forms";

export default async function ResidentRequestsPage() {
  const ctx = await getResidentTenantContext();
  if (!ctx.ok) return <NoTenantNotice reason={ctx.reason} />;

  const supabase = createClient();
  const profileId = ctx.profile.profileId;
  const { businessProfileId } = ctx;

  const [buildings, annRes, reqRes] = await Promise.all([
    getResidentBuildingOptions(supabase, {
      profileId,
      businessProfileId,
    }),
    supabase
      .from("announcements")
      .select(
        "id, title, body, created_at, image_urls, video_urls, buildings!inner(business_profile_id)"
      )
      .eq("buildings.business_profile_id", businessProfileId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("service_requests")
      .select(
        "id, title, status, created_at, reported_by, image_urls, video_urls, buildings!inner(business_profile_id)"
      )
      .eq("buildings.business_profile_id", businessProfileId)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const items = annRes.data ?? [];
  const annError = annRes.error;
  const rows = reqRes.data ?? [];
  const reqError = reqRes.error;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          מודעות וקריאות
        </h1>
        <p className="text-sm text-muted-foreground">
          עוברים בין מודעות לקריאות שירות של הבניין. כפתור &quot;הוסף&quot;
          לפתיחת טופס פרסום או קריאה חדשה — כולל צירוף עד שתי תמונות ושני
          סרטונים.
        </p>
      </div>

      {annError ? (
        <p className="text-sm text-destructive">{annError.message}</p>
      ) : null}
      {reqError ? (
        <p className="text-sm text-destructive">{reqError.message}</p>
      ) : null}

      <ResidentHubForms
        buildings={buildings}
        businessProfileId={businessProfileId}
        currentProfileId={profileId}
        announcements={items}
        serviceRequests={rows}
      />
    </div>
  );
}
