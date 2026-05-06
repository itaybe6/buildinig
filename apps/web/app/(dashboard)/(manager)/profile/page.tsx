import { ManagerProfileForms } from "@/components/manager/manager-profile-forms";
import { NoTenantNotice } from "@/components/no-tenant-notice";
import {
  getManagerTenantContext,
  requireAuthProfile,
} from "@/lib/dashboard/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ManagerProfilePage() {
  const auth = await requireAuthProfile();
  if (auth.role !== "manager") {
    redirect("/dashboard");
  }

  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return <NoTenantNotice reason={ctx.reason} />;
  }

  const supabase = createClient();

  const [{ data: userRow }, { data: business }, { data: profileRow }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("business_profiles")
        .select(
          "id, name, logo_url, primary_color, contact_email, contact_phone, legal_name, tax_id, mobile_phone, notes, plan, is_active, created_at"
        )
        .eq("id", ctx.tenantId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("full_name, phone, mobile_phone")
        .eq("id", auth.profileId)
        .maybeSingle(),
    ]);

  const email = userRow.user?.email ?? "";

  if (!business) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">פרופיל</h1>
        <p className="text-sm text-muted-foreground">
          לא נטען פרופיל עסק — ודא שקיימת רשומה ב-business_profiles.
        </p>
      </div>
    );
  }

  const profile = profileRow ?? {
    full_name: auth.fullName,
    phone: null as string | null,
    mobile_phone: null as string | null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">פרופיל</h1>
        <p className="text-sm text-muted-foreground">
          עריכת פרטי העסק (business_profiles) והמשתמש שלך (profiles), כולל אימייל
          וסיסמת כניסה.
        </p>
      </div>

      <ManagerProfileForms
        business={{
          id: business.id,
          name: business.name,
          logo_url: business.logo_url,
          primary_color: business.primary_color,
          contact_email: business.contact_email,
          contact_phone: business.contact_phone,
          legal_name: business.legal_name,
          tax_id: business.tax_id,
          mobile_phone: business.mobile_phone,
          notes: business.notes,
          plan: business.plan,
          is_active: business.is_active,
          created_at: business.created_at,
        }}
        profile={{
          full_name: profile.full_name,
          phone: profile.phone,
          mobile_phone: profile.mobile_phone,
        }}
        authEmail={email}
      />
    </div>
  );
}
